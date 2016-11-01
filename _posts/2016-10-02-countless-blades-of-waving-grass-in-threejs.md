---
layout: post
title: "Countless Blades of Waving Grass in Three.js"
category: 
tags: []
---

In this note I've written down the steps followed to make this [demo](/demo/grass). The two main resources consulted are the 
[Nvidia GPU gem](http://http.developer.nvidia.com/GPUGems/gpugems_ch07.html) and this  [demo](http://oos.moxiecode.com/js_webgl/grass_quads/) by [Outside Of Society](http://oos.moxiecode.com/blog/)

## The plane
I've created a plane following the structure suggested by the demo by "Outside of society" linked before. I've isolated this code in a single method because it does something particular.
This structure is what in the [Nvidia paper](http://http.developer.nvidia.com/GPUGems/gpugems_ch07.html) are called "clusters", I really liked the solution adopted by the author to recreate them using a plane and I think it deserved a look in deep.

![planes](/assets/media/posts/grass/planes.png)

Let's see these 4 steps:

- Step 1: It first create a plane, then it iterates through the vertices and it moves them along the z axis in order to give to the plane a zig-zag like profile.

```javascript
function createPlanesGeometry(n_planes){
    var planeGeometry = new THREE.PlaneGeometry(400, 30, 14, 1);
    for (var i = 0; i < planeGeometry.vertices.length; i++) {
        planeGeometry.vertices[i].z = Math.sin(planeGeometry.vertices[i].x)*20;
    };
    planeGeometry.applyMatrix( new THREE.Matrix4().setPosition( new THREE.Vector3( 0, 15, 0 ) ) );
    var bufferedGeometry = new THREE.BufferGeometry().fromGeometry(planeGeometry);
    return bufferedGeometry
}
```

- Step 2: It creates different planes reposistioning the original one, getting the mesh from each plane and merge it into the final buffer geometry containing the planes

```javascript
for (var i = 0; i < n_planes; i++) {
    mesh.position.z += Math.random()*20 - 10;
    mesh.position.x += Math.random()*20 - 10;
    mesh.scale.y = 1.1-Math.random()*0.4;
    // step 3 and 4 goes here

    mesh.updateMatrix();
    containerGeometry.merge(mesh.geometry, mesh.matrix);
};
```

- Step 3. The reposition is not enough to create the cluster, they have to cross each other. That's why it rotates each plane

```javascript
mesh.rotation.y = (i%3 * rot) + Math.random()-0.5;
```

- Step 4. And then it repositionate each plane on the x and z axis.

```javascript
mesh.position.set(x*50 -250 , 0, z*80 -180 );
```


## The Texture
I've used a texture like this one
![planes](/demo/grass/images/thingrass-gold.jpg)
And I've applied it to the plane's mesh.

```html
<script type="x-shader/x-vertex" id="vertexshader">
uniform vec2 uvScale;
varying vec2 vUv;
varying vec3 vNormal;

void main() {
    vNormal = (modelMatrix * vec4(normal, 0.0)).xyz; ;
    vec3 pos = position;
    vUv = uvScale * uv;
    vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
}
</script>

<script type="x-shader/x-fragment" id="fragmentshader">
uniform vec3 color;
uniform sampler2D texture;

varying vec3 vNormal;
varying vec2 vUv;

const float threshold = 0.05;
void main() {
    vec4 textureColor = texture2D(texture, vec2(vUv.s, vUv.t));

    if (textureColor[0] < threshold && textureColor[1] < threshold && textureColor[2] < threshold) {
        discard;
    } else {
        gl_FragColor = textureColor;
    }
}
</script>
```

The threshold value is pretty important. It decides if the pixel contained in the texture has to be drawn or not. In this case, if the pixel is too dark it will be discarded. In order to obtain decent results, this value has to be tuned with the texture.
The plane with the texture applied, from the top, look like this:
![planes](/assets/media/posts/grass/planes-texture.png)

## The sky

To create the sky, I've simply positioned the top part of a sphere over the planes, and, as texture, I've applied a picture of a sunset token in Portugal.

```javascript
var bgGeometry = new THREE.SphereBufferGeometry(raySpheroDome, 12, 12, 0, Math.PI*2, 0, Math.PI*0.5);
var bgMaterial = new THREE.MeshBasicMaterial(
    {color: 0x999999, map: bgTexture, fog: false, side: THREE.BackSide});
bgGeometry.applyMatrix( new THREE.Matrix4().makeRotationY(-Math.PI-1.25));
var sky = new THREE.Mesh(bgGeometry, bgMaterial);
sky.position.set(0, -50, 0);
sky.rotation.y = Math.PI;
sky.matrixAutoUpdate = false;
sky.updateMatrix();
scene.add(sky);
```

I've applied a rotation on the Y axis in order to match the lighter part of the texture with my source light.

## The light of the Sun

To make the light, i did not use the threejs light, but I've simply defined a light position, a light power and a light color value. This is the fragment shader that defines how the light affects the blades.

```c
uniform vec3 lightColor;
uniform float lightPower;
uniform float ambientLightPower;
uniform sampler2D texture;
varying vec3 vNormal;
varying vec2 vUv;
varying vec4 vLightPos;
varying vec4 vecPos;

const float threshold = 0.48;
void main() {
    vec4 textureColor = texture2D(texture, vec2(vUv.s, vUv.t));
    if (textureColor[0] < threshold && textureColor[1] < threshold && textureColor[2] < threshold) {
        discard;
    } else {
        // this part is well explained in this tutorial
        // http://www.opengl-tutorial.org/beginners-tutorials/tutorial-8-basic-shading/
        //calculate the distance between the vertex position and the light, the nearer the brighter
        float dist = length(vLightPos - vecPos) * 0.0015;
        //the color of the light, define as uniform
        vec4 lightColor = vec4(lightColor, 1.0);
        // the direction of the light
        vec3 lightDirection = normalize(vecPos.xyz - vLightPos.xyz);
        // this is the formula to calculate how the angle between the light direction and the surface
        // affects the light
        float cosTheta = clamp( dot( vNormal,lightDirection ),0.0, 1.0);
        // Here we are cheating. Everyone does ;) to calculate all the refraction of the light in the
        // space is too expensive. Let's add the same amount of light to all the pixels
        vec4 materialAmbientColor = vec4(vec3(ambientLightPower), 1.0) * textureColor;
        gl_FragColor = materialAmbientColor +
                        textureColor * lightColor * lightPower * cosTheta / (dist * dist);
    }
}
```
This is the scene seen from the top, with the light positioned at the border of the sphere.
![sky](/assets/media/posts/grass/sky-light.png)

## Move the blades with the wind

To move the blade I've simply used `sin` and `cos` and a noise function. Probably there is a way to avoid the use of a noise function and to achieve a similar result just using `sin` and `cos` of the time delta, but with noise it looks slightly better. The noise function comes from [this shadertoy](https://www.shadertoy.com/view/4dS3Wd), the vertex shader code looks like this.

```c
void main() {
    vNormal =  (modelMatrix * vec4(normal, 0.0)).xyz;
    vec3 pos = position;
    // animate the pixel that are upon the ground
    if (pos.y > 1.0) {
        float noised = noise(pos.xy);
        pos.y += sin(globalTime * magnitude * noised);
        pos.z += sin(globalTime * magnitude * noised);
        pos.x += sin(globalTime * magnitude * noised);
    }
    vUv = uvScale * uv;
    vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
    vLightPos = projectionMatrix * modelViewMatrix * vec4(lightPos, 1.0);
    vecPos = projectionMatrix * mvPosition;
    gl_Position = vecPos;
}
```

And this is the final [result](/demo/grass)

![grass](/assets/media/grass/grass-small.png)



