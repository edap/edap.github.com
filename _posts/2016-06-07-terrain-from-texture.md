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

Now select the path tool, and draw a closed path that connects the dark regions of the picture. Do not draw a bezier curve, don't stretch the point in order to obtain a smooth curve. Simply click with the mouse and put the points along the path as in the picture. There is a reason why we are doing like this, it is explained later in the 'create the path' section.
1) Right click -> edit -> Stroke Path -> stroke with a paint tool. Select the brush tool, be sure that the selected color is black, then click on "Stroke". The result should be
similar to the the image on the right. Export the image as `terrain.png`.
2) Select Window -> Dockable dilaog -> path. Select the path and save it as `path.svg`. This is the path along with we will move the camera later.
![path](/assets/media/posts/terrain-path.png)

## Load the texture and generate the heights

Now we have to create a plane geometry and associate a texture to it.  

```javascript
var plane_rotation = Math.PI/2;
var bumpScale = 200;
var terrain;

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

Now we will load the svg file to create the spline along which the camera will move. You have to scale your gimp xfc project to have the same dimension of the geometry plane, if they are differents. In my case I've a plane that is 2000x2000, and I've scaled my gimp image accordingly (click on image -> scale, the path will automatically scaled too). 

We first have to load the svg file (see the code in the demo about how to load resources using promises), then we have to parse the svg file to find out the coordinates of the vertices that will compose the path.
Gimp automatically export any svg path in a bezier curve. That means that every point in the svg file is composed by 3 couple of x y coordinates. The first and the last couple are the handles of the point, and the second point is the middle point in the bezier curve. Bezier curve are a nice way to represent curves, but in our case they have a downside, the point composing a bezier curve are not equidistant. If we would move the camera along a bezier curve, the camera will scatter along the points, going slower where there are more points composing the curve, and going faster when there are less point. To have a smooth camera movement we need equidistant points. In order to do that, for every point composing the curve, we will discard the coordinates of the handles, we will take only the middle point and we will use all these middle points to create a Catmull-Rom spline. ThreeJS provide a class that abstracts this type of curve and also calculates the interpolated position of each point between the points we have defined in gimp. 

Inspecting the loaded element, we can see how the svg is structured.
![no-path](/assets/media/posts/get_svg.png)
The points are stored in the `d` attribute. `M` is the position of the origin, `C` is the curve [command](https://www.w3.org/TR/SVG/paths.html#PathDataCurveCommands) and `Z` means [close the path](https://www.w3.org/TR/SVG/paths.html#PathDataClosePathCommand).

There are many javascript libraries to parse svg, the popular one is probably [raphael](http://dmitrybaranovskiy.github.io/raphael/), I will use this library in the future because I don't like my solution but for now I've simply written this function that reads the position of the vertices. 

```javascript

function readVerticesInSvg(svgPath) {
    var vertices = [];
    //this is ugly
    var points = svgPath.getElementById('Unnamed').getAttribute('d').split("            ");
    var position = points[0];
    var curvePoints = points.slice(1);
    for (var i = 0; i< curvePoints.length; i++) {
        var arc = curvePoints[i].trim();
        var coordinates = arc.split(' ');
        //take only the middle point ([1]), discard the handles([0] and [2]) of the point of
        //the bezier curve. We will use the Catmull-Rom curve
        var point = coordinates[1];
        // do not consider values like 'C' and 'Z' that has length == 1. We already know that is a curve and that is closed
        if (point.length > 1) {
            var pointCoord = point.split(',');
            vertices.push( new THREE.Vector3(pointCoord[0], pointCoord[1], 0));
        }
    }
    return vertices;
}

```

## Move camera along the path

To move the camera along the path we change the position of the camera a bit forward everytime the function `render` is called.
In the line where `lookAt` is used, we orientate the camera in direction of the next position that the camera will have. In this way the camera is always looking ahead. 
The variable `cameraSpeed` allow us to modulate the velocity of the camera.

```javascript

function render() {
    moveCamera();
    renderer.render( scene, camera );
}

function moveCamera() {
    var camPos = spline.getPointAt(t);
    camera.position.set(camPos.x,camPos.y,camPos.z);
    camera.lookAt(spline.getPointAt(t + cameraSpeed * 2));
    t = (t >= 0.99) ? 0 : t += cameraSpeed;
}
```

## Add the background

To add the background I've created another scene and another camera, called `backgroundScene` and `backgroundCamera`. Everytime the render function is called, the screen get cleaned, then first the backgroundScene is rendered, and then the scene is rendered. Have a look at the `initBackground` function and at the `render` function.

## Press the bar to enter the dog

This sketch has 2 modes, one with a barking dog and another without it. The variable in which the mode is saved is called `barkingDog`, and its status get swapped pressing the bar.
To move the camera up and down, i've applied a `sin` movement on the `y` axis of the camera. I've defined a camera height, and a maximum height position that is equal to `cameraHeight * 1.5`. I've stored this value in the `yPos` variable, and I've used it also to define the `y` position of the camera's lookAt position. The `moveCamera` function looks now like this:

```javascript
function moveCamera() {
    var camPos = spline.getPointAt(t);
    var sinYpos = Math.sin(new Date().getTime() * jumpFactor) * cameraHeight;
    var yPos = sinYpos.map(-cameraHeight, cameraHeight, cameraHeight, (cameraHeight * 1.5));
    camera.position.set(camPos.x, yPos, camPos.z);
    var look = spline.getPointAt(t + cameraSpeed * 20);
    look.y = yPos;
    camera.lookAt(look);
    t = (t >= 0.99) ? 0 : t += cameraSpeed;
}
```

There is a value in this snippet that has to be explained, the `jumpFactor`. I wanted to change the movement of the camera when the bar is pressed, making the camera running faster along the path and moving the camera faster also on the `y` axis. That means I've to increase the frequency of the sin wave generating the `y` movement, and to increase the `cameraSpeed` value as well.

```javascript
function maybeSpacebarPressed(e){
    if (e.keyCode === 0 || e.keyCode === 32) {
        e.preventDefault();
        barkingDog = !barkingDog;
        if (barkingDog) {
            cameraSpeed = 0.0003;
            jumpFactor = 0.02;
            barkingDogSound.play();
        } else {
            cameraSpeed = 0.0001;
            jumpFactor = 0.009;
            barkingDogSound.stop();
        }
    }
}
```

The `barkingDogSound` is an instance of `THREE.Audio`, it plays the sound of a barking dog when the bar is pressed, in the `initAudio` method there are the details of the implementation.


![no-path](/assets/media/posts/path_and_bg.png)


### Texture splatting
I've collected the textures during a trip in Sächsische Schweiz. mostly rock's surfaces around an area called "Affenstein", I've opened Gimp and then Filter -> Map -> make seamless. Then I've resized the picture to 512x512. You can find a collection of textures here. In the [Stemkoski website] (http://stemkoski.github.io/Three.js/Shader-Heightmap-Textures.html) there is a nice example about how to use texture splatting in ThreeJS using the `smoothstep` function in the fragment shader, I've basically followed that structure. It is pretty important to understand how to interpolate nicely the texture, I've drawn this orrible graph that tries to show how the overlapping of 2 curves is essential to merge the textures smoothly together. 

![no-path](/assets/media/posts/texture-splatting.jpg)


## All together
