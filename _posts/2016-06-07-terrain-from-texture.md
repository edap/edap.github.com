---
layout: post
title: "terrain from texture"
category: 
tags: []
---

In the last days I was looking for a way to draw a terrain with a closed path in the middle were the camera can move along. I've take into consideration these 3 approaches:
 - Generate the noise

## Generate the texture with gimp

Open Gimp, create a new file, select "advanced options" and pick"Grayscale". Choose as dimension 512 x 512. Now select filter -> render -> clouds -> solid noise. Set "detail" to
10 and X size and Y size to 10. Play with these values to see how they affect your picture. When you are satisfied, click ok.

Now select "Color" -> "Brightness-Contrast" and increase the contrast. The goal is to have more black areas that later can be easily connected by a path. I've ended up with an image
like this

![no-path](/assets/media/posts/terrain-no-path.png)

Now select the paths tool, and draw a closed path that connect the dark area of the picture. When the path is closed:
1) Right click -> edit -> Stroke Path -> stroke with a paint tool. Select the brush tool, be sure that the selected color is black, then click on "Stroke". The result should be
similar to the the image on the right. Export the image as `noise.png`.
2) Select Window -> Dockable dilaog -> path. Select the path and save it as `path.svg`. This is the path along with we will move the camera later.
![path](/assets/media/posts/terrain-path.png)

## Load the texture and generate the heights

Now we have to create a plane geometry and associate a texture to it.  

```javascript
//global vars
var plane_rotation = Math.PI/2;
var bumpScale = 200;
var terrain;

// in the init method
var bumpTexture = loadTexture( 'noise.png' );
var customMaterial = createCustomMaterial( bumpTexture );
var geometryPlane = new THREE.PlaneBufferGeometry(2000, 2000, 50, 50);
geometryPlane.rotateX( - plane_rotation);
terrain = new THREE.Mesh( geometryPlane, customMaterial );
scene.add( terrain );

function createCustomMaterial( texture ) {
    var myUniforms = {
        bumpScale: {type: 'f', value: bumpScale},
        bumpTexture: {type: 't', value: texture}
    };

    var customMaterial = new THREE.ShaderMaterial({
        uniforms: myUniforms,
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent,
    });

    return customMaterial;
}

function loadTexture( filename ){
    var loadingManager = new THREE.LoadingManager( function(){
        terrain.visible = true;
    });
    var textureLoader = new THREE.TextureLoader( loadingManager );
    var bumpTexture = textureLoader.load('noise.png');
    bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping;

    return bumpTexture;
}
```

## Vertical displacement in the vertex shader

Vertex shader code:

```c
uniform sampler2D bumpTexture;
uniform float bumpScale;
varying float vAmount;
varying vec2 vUV;

void main() {
  vUV = uv;
  vec4 bumpData = texture2D( bumpTexture, vUV );
  vAmount = bumpData.r; // assuming map is grayscale it doesn't matter if you use r, g, or b.

  // move the position along the normal
  vec3 newPosition = position + normal * bumpScale * vAmount;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
}
```

Fragment shader code:

```c
varying vec2 vUV;
varying float vAmount;

void main() {
  //uncomment for colors
  //vec3 color = vec3( vUV * ( 1. - 0.5 * vAmount ), 0.0 );
  //gl_FragColor = vec4( color.rgb, 1.0 );
  //black and white
  gl_FragColor = vec4(vAmount * 1.);
}
```


## Create the path

## Move camera along the path

## All together
