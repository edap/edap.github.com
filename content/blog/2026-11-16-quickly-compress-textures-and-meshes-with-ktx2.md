---
layout: blog-post
date: "2026-11-16"
title: "Quickly compress textures and meshes to KTX2"
category: 
tags: [WebGL, glTF, KTX2, Podman]
---

When you inspect a 3D scene in the browser, the textures are often the heaviest asset. A `.glb` file with 3 2k textures can already be a few megabyte on the disk. For which you also have to consider the time that the user is waiting to download them. The model that we are going to test, for example, contains 5 textures and each texture takes 22MB of video memory, meaning 100MB for a single model. Once they are downloaded, the browser has to decode the JPG/PNG file and upload it to the GPU uncompressed.

[KTX2](https://www.khronos.org/ktx/) with [Basis Universal](https://github.com/BinomialLLC/basis_universal) compression it is what you should use when dealing with models in the browsers.
A KTX2 texture it is small like a JPG, and it can be transcoded at runtime to a format that a GPU can understand. So, basically is like uploading compressed texture to the GPU that can stay compressed.

But there is an intermediate step in between. The format `Basis Universal` can not be read by the GPU directly, it needs to be converted by the format that the physical GPU supports:

| Device    | Compressed format   |
| --------        | -------       |
| Desktop         | BC7, BC1/BC2  |
| Android         | ETC2          |
| iOS             | ASTC          |

In `three.js`, `KTX2Loader` is responsible for converting from Basis Universal to the compressed format supported by the user's GPU. This works only if the extension `KHR_texture_basisu` is supported, which is true for all the modern brwoser, but not for the old ones.


### The problem: installing the tools

The best tool to compress texture, but also to compress 3D meshes, is [glTF-Transform](https://gltf-transform.dev/). It is a CLI tool that can convert images to KTX2, and can also prune, resize, depublicate and compress meshes with Draco. It is really the swiss knife for 3D asset compression. The problem is that if you want to run it locally you need to install CMake, Ninja, etc..., it adds a lot of software that you are probably going to use just for this goal. Then you need Node.js for glTF-Transform, and then they need to work together.

Some months ago I have packaged the tool in a container image [edap/gltf-transform-ktx2](https://hub.docker.com/r/edap/gltf-transform-ktx2) ready to use, to save me some time the next time that I need to optimize some assets. It is built on `node:20-slim` and contains:

- `gltf-transform` 4.3.0
- `ktx` v4.4.2, compiled from source

Here below I explain how to use it

### Pull the image with Podman

I am using podman, but if you prefer Docker, just replace the word `podman` with `docker` and it works.


```bash
podman pull docker.io/edap/gltf-transform-ktx2:v1.0.0
```

Check that both tools (ktx and gltf-transform) are working:

```bash
podman run --rm docker.io/edap/gltf-transform-ktx2:v1.0.0 ktx --version
# ktx version: v4.4.2

podman run --rm docker.io/edap/gltf-transform-ktx2:v1.0.0 gltf-transform --version
# 4.3.0
```

Now you can run the tools on some of the assets. In order to do so, the container needs access to the assets. You have to mount the current folder into `/workspace`, and use this one as your working directory. Here below I assume that the current directory is where you assets are


```bash
podman run --rm -v "$PWD":/workspace:rw -w /workspace \
  docker.io/edap/gltf-transform-ktx2:v1.0.0 <command>
```

- `--rm` deletes the container when the command finishes.
- `-v "$PWD":/workspace:rw` mounts the current folder inside the container, with read and write access.
- `-w /workspace` runs the command from that folder, so you can use relative paths.

With rootless Podman, the files created inside the container belong to your user on the host, not to `root`. On distributions with SELinux enabled (Fedora, RHEL), add `:Z` to the volume (`-v "$PWD":/workspace:rw,Z`), otherwise the container cannot read the folder.

I define an alias for this line because is too long for my lazy soul:

```bash
alias gltfktx='podman run --rm -v "$PWD":/workspace:rw -w /workspace docker.io/edap/gltf-transform-ktx2:v1.0.0'
```

And I use this alias in all the next examples. The mesh example uses the [DamagedHelmet](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/DamagedHelmet) model from the Khronos glTF samples repository.

### Compress a single image

Let's see how to convert a single image `example.png` to KTX2 with `ktx create`:.


```bash
gltfktx ktx create \
  --format R8G8B8A8_SRGB \
  --encode basis-lz \
  --generate-mipmap \
  example.png example.ktx2
```

- `--format R8G8B8A8_SRGB`: the format of the input data, an RGBA color image in sRGB.
- `--encode basis-lz`: use ETC1S compression, which gives very small files. The alternative is `uastc`, which has better quality but produces bigger files.
- `--generate-mipmap`: generate the mipmaps now, so they don't have to be generated at runtime.

You can now load `example.ktx2` in Three.js with the `KTX2Loader`. And more in general, you can use this command to get KTX2 texture whenever you need them. 

### Compress a mesh

When compressing a `.glb` mesh that contains materials with texture, `gltf-transform` convert to KTX2 the texture contained in the material.


This is the chain of commands that I use in my conversion script:

```bash
gltfktx sh -c '
  gltf-transform prune  DamagedHelmet.glb out.glb &&
  gltf-transform dedup  out.glb out.glb &&
  gltf-transform weld   out.glb out.glb &&
  gltf-transform resize out.glb out.glb --width 1024 --height 1024 &&
  gltf-transform etc1s  out.glb out.glb --quality 75 --verbose
'
```

Here we run `sh -c` inside the container, so the whole chain runs in a single container.

- `prune` removes unused nodes, materials, textures and accessors.
- `dedup` removes duplicated accessors, meshes, materials and textures.
- `weld` merges the vertices that are identical and adds an index buffer.
- `resize` limits the textures to 1024x1024, keeping the aspect ratio. It never upscales.
- `etc1s` converts all the textures to KTX2 with ETC1S compression. `--quality` is the same as `--qlevel` above, from 1 to 255. glTF-Transform also has a `uastc` command, if you need higher quality. With `--verbose` you see the `ktx create` commands that it runs for each texture.

In my personal experience, sometime models brakes when they are complex, with a lot of materials and when I try to compress them too much. My suggestion is to start with a `quality` parameter to 80, and then decrease until it brakes.

Once we are done, we can also compress the mesh using Google's Draco:


```bash
gltfktx gltf-transform draco out.glb out_draco.glb
```

These are the results for the helmet:

| step                 | file size | GPU memory per texture |
| ---                  | ---       | ---                    |
| original (JPEG)      | 3.77 MB   | 22.37 MB               |
| resize to 1024       | 1.24 MB   | 5.6 MB                 |
| + KTX2 (ETC1S)       | 1.00 MB   | 0.70 MB                |
| + Draco              | 0.53 MB   | 0.70 MB                |

As you see, the file is 7 times smaller, and the VRAM usage goes fomr ~112MB to 3.5 MB.

It is possible to inspect the textures of a glb file with `gltfktx gltf-transform inspect out.glb`.


Draco is cool and makes the mesh much smaller, but there is an additional step for the browser, that has to decode it, and for that it needs the Draco decoder (in Three.js, the `DRACOLoader`).In my opinion, there is no need to use Draco for small meshes, that's why I have put Draco compression as optional.

Now, if you want to load these files in Three.js, set up the `KTX2Loader` (and the `DRACOLoader`, if you use Draco) on the `GLTFLoader`:

```js
const ktx2Loader = new KTX2Loader()
  .setTranscoderPath('three/examples/jsm/libs/basis/')
  .detectSupport(renderer);

const loader = new GLTFLoader().setKTX2Loader(ktx2Loader);
```

