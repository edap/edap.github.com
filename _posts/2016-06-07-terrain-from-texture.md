---
layout: post
title: "terrain from texture"
category: 
tags: [threejs, openFrameworks]
---

In the last days I was looking for a way to draw a terrain with a closed road were the camera can move along. I've taken into consideration these 3 approaches:

* Generate the terrain geometry using noise, then find a way to move the camera around where the value on the `y` axis is 0.
* Download an height-map from the web, possible an height-map that contains a street, or a river.
* Generate the terrain from an image containing Perlin noise.

I went for the latter one, mostly because it was easy to draw a path on it and use it for the camera. The demo example is [here]({{site.url}}/demo/terrain). The source code is available on my [github repository](https://github.com/edap/edap.github.com/tree/master/demo/terrain).

## Generate the texture with gimp

Open Gimp, create a new file, select "advanced options" and pick"Grayscale". Choose as dimension 512 x 512. Now select filter -> render -> clouds -> solid noise. Set "detail" to
10 and X size and Y size to 10. Play with these values to see how they affect your picture. When you are satisfied, click ok.

Now select "Color" -> "Brightness-Contrast" and increase the contrast. The goal is to have more black areas that later can be easily connected by a path. I've ended up with an image
like this

![no-path](/assets/media/posts/terrain-no-path.png)

Now select the path tool, and draw a closed path that connects the dark regions of the picture. Do not draw a bezier curve, there is no need to stretch the point in order to obtain a smooth curve. Simply click with the mouse and put the points along the path as in the picture, the curve type we are going to use later will make a smooth curve for us.
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
var geometryPlane = new THREE.PlaneBufferGeometry(2048, 2048, 50, 50);
geometryPlane.rotateX( - plane_rotation);
terrain = new THREE.Mesh( geometryPlane, customMaterial );
scene.add( terrain );

function createCustomMaterial( texture ) {
    var myUniforms = {
        bumpScale:   {type: 'f', value: bumpScale},
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

Now we will load the svg file to create the spline along which the camera will move. You have to scale your gimp xfc project to have the same dimension of the geometry plane, if they are differents. In my case I've a plane that is 2048x2048, and I've scaled my gimp image accordingly (click on image -> scale, the path will automatically scaled too). 

We first have to load the svg file (see the code in the demo about how to load resources using promises), then we have to parse the svg file to find out the coordinates of the vertices that will compose the path.
Gimp automatically export any svg path in a bezier curve. That means that every point in the svg file is composed by 3 couple of x y coordinates. The first and the last couple are the handles of the point, and the second point is the middle point in the bezier curve. Bezier curve are a nice way to represent curves, but in our case it is just more complexity when parsing the svg and created the curve. To keep the things simple,, for every point composing the curve, we will discard the coordinates of the handles, we will take only the middle point and we will use all these middle points to create a Catmull-Rom spline. ThreeJS provide a class that abstracts this type of curve and also calculates the interpolated position of each point between the points we have defined in gimp. When creating the geometry out of these vertices, we need to use `getSpacedPoints`, to have equidistant points, otherwise the camera will scatter along the points, going slower where there are more points composing the curve, and going faster when there are less point.

Inspecting the loaded element, we can see how the svg is structured.
![no-path](/assets/media/posts/get_svg.png)
The points are stored in the `d` attribute. `M` is the position of the origin, `C` is the curve [command](https://www.w3.org/TR/SVG/paths.html#PathDataCurveCommands) and `Z` means [close the path](https://www.w3.org/TR/SVG/paths.html#PathDataClosePathCommand).

There are many javascript libraries to parse svg, the most popular one is probably [raphael](http://dmitrybaranovskiy.github.io/raphael/), I will use this library in the future because I don't like my solution but for now I've simply written this function that reads the position of the vertices. 

```javascript

function readVerticesInSvg(svgPath) {
    var vertices = [];
    //this is ugly, I know
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

function createSplineGeometry(curve) {
    var geometry = new THREE.Geometry();
    geometry.vertices = curve.getSpacedPoints( curveDensity );
    return geometry;
}


```

## Move camera along the path

To move the camera along the path we change the position of the camera a bit forward everytime the function `render` is called.
When we are close to the end of the path, restart from 0.
In the line where `lookAt` is used, the camera is turned in the direction of the next position that the camera will have, so that it will always looks ahead. I've choosed to look 20 points forward to have the camera turning smoothly, with a value like 2 instead of 20, for each step forward, the rotations on the `y` axis  are bigger, and the camera is shaking a bit too much. I've introduced a control over the `lookAtPoint` because when we are near to the end of the path the camera was looking back for a moment befor to come back in the right position.

```javascript

function render() {
    moveCamera();
    renderer.render( scene, camera );
}

function moveCamera() {
    var camPos = spline.getPointAt(t);
    camera.position.set(camPos.x,camPos.y,camPos.z);
    var next = t + cameraSpeed * 20;
    var lookAtPoint = (next > 1) ? 0 : next;
    var look = spline.getPointAt(lookAtPoint);
    camera.lookAt(spline.getPointAt(t + cameraSpeed * 2));
    t = (t >= 0.99) ? 0 : t += cameraSpeed;
}
```

## Add the background

To add the background I've preferred to use a [skydome](http://www.ianww.com/blog/2014/02/17/making-a-skydome-in-three-dot-js/) instead a [skybox](https://aerotwist.com/tutorials/create-your-own-environment-maps/). It is simpler and and in my case it fits perfectly my needs because most of the time the mountains are covering the sky. It is also possible to obtain nice effect with small texture, in my example the texture is only 128x128 px. The method that take care of the background is called `createSkyBox`.

## Press the bar to enter the dog

This sketch has 2 modes, one with a barking dog and another without it. The variable in which the mode is saved is called `barkingDog`, and its status get swapped pressing the bar.
To move the camera up and down, i've applied a `sin` movement on the `y` axis of the camera. I've defined a camera height, and a maximum height position that is equal to `cameraHeight * 1.2`. I've stored this value in the `yPos` variable, and I've used it also to define the `y` position of the camera's lookAt position. The `moveCamera` function looks now like this:

```javascript
function moveCamera() {
    var camPos = spline.getPointAt(t);
    var yPos;
    if (barkingDog) {
        var sinYpos = Math.sin(new Date().getTime() * jumpFrequency) * cameraHeight;
        yPos = sinYpos.map(-cameraHeight, cameraHeight, cameraHeight, (cameraHeight * 1.2));
    } else {
        yPos = cameraHeight;
    }
    camera.position.set(camPos.x, yPos, camPos.z);

    var next = t + cameraSpeed * 20;
    var lookAtPoint = (next > 1) ? 0 : next;
    var look = spline.getPointAt(lookAtPoint);
    look.y = yPos;
    camera.lookAt(look);

    var limit = 1 - cameraSpeed;
    t = (t >= limit) ? 0 : t += cameraSpeed;
}

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

```

This is the method that controls the `barkingDog` value, the sound and the speed.

```javascript
function maybeSpacebarPressed(e){
    if (e.keyCode === 0 || e.keyCode === 32) {
        e.preventDefault();
        barkingDog = !barkingDog;
        if (barkingDog) {
            cameraSpeed = 0.0003;
            barkingDogSound.play();
        } else {
            cameraSpeed = cameraSpeedDefault;
            barkingDogSound.stop();
        }
    }
}
```

The `barkingDogSound` is an instance of `THREE.Audio`, it plays the sound of a barking dog when the bar is pressed, in the `initAudio` method there are the details of the implementation.


![no-path](/assets/media/posts/path_and_bg.png)


### Texture splatting
I've collected the textures during a trip in Sächsische Schweiz. Mostly rock's surfaces around an area called "Affenstein". To obtain a texture out of a picture with Gimp is easy. I've opened Gimp and then Filter -> Map -> Make Seamless. Then I've resized the picture to 512x512. In the [Stemkoski website](http://stemkoski.github.io/Three.js/Shader-Heightmap-Textures.html) there is a nice example about how to use texture splatting in ThreeJS using the `smoothstep` function in the fragment shader, I've basically followed that structure. It is pretty important to understand how to interpolate nicely the textures, I've drawn this orrible graph that tries to show how the overlapping of 2 curves is essential to merge the textures smoothly together. 

![no-path](/assets/media/posts/texture-splatting.jpg)


## Add the trees

I' ve generated the mesh for the trees using openFrameworks and my addon [ofxLSystem](https://github.com/edap/ofxLSystem).All the trees are generated with from the same mesh. I've scaled and rotated it to make the trees look differents from each other. As i wanted to have trees only near the track, I've to check the coordinates where the tree is supposed to be placed in the image texture. If the pixel is black it means there are no mountains at that coordinates, and the tree can be put there. Otherwise i will just iterate over the next tree.
The coordinates of the points on the path are in a different scale and position than the coordinate of the texture (my path was on a surface of 2014x2024, translated on the y and x axis and rotated, the texture has not translation nor rotation and it is 512x512), that's why there are coordinate conversions in this method:

```javascript
function createTreesGeometry(ofMesh, bumpTexture){
    var density = 1; // n trees pro point in curve, more trees is also less fps :(
    var context = createCanvasContext(bumpTexture);
    // ratio between the geometry plane and the texture
    var ratio = side / bumpTexture.image.width;

    ofMesh.computeFaceNormals();
    ofMesh.computeVertexNormals();

    var geometriesContainer = new THREE.Geometry();
    for (var i = 0; i< spline.points.length; i++) {
        var pos = spline.points[i];
        for (var d = 0; d <= density; d++) {
            // coordinates conversion + random positioning
            var randX = Math.floor(pos.x + getRandomArbitrary(-maxDistanceFromPath, +maxDistanceFromPath));
            var randY = Math.floor(pos.z + getRandomArbitrary(-maxDistanceFromPath, +maxDistanceFromPath));
            var x = Math.floor((randX + side/2) / ratio);
            var y = Math.floor((randY + side/2) / ratio);
            // put thress only where there are no mountains (eg, the pixel is black)
            if (context.getImageData(x, y, 1, 1).data[0] === 0) {
                // some big tree, some small tree
                var randomScalar = getRandomArbitrary(0.03, 0.07);
                var tree = new THREE.Geometry();
                tree.merge(ofMesh);
                tree.applyMatrix(new THREE.Matrix4().multiplyScalar( randomScalar ));
                tree.applyMatrix(
                    new THREE.Matrix4().makeTranslation( randX, (pos.y - cameraHeight), randY ) );
                tree.rotateY = Math.PI / getRandomArbitrary(-3, 3);
                geometriesContainer.merge(tree);
            }
        }
    }
    return geometriesContainer;
}

function createTrees(ofMesh, fog, bumpTexture){
    treeMaterial = createTreeMaterial(fog);
    var treesGeometry = createTreesGeometry(ofMesh, bumpTexture);
    var treesBufferGeometry = new THREE.BufferGeometry().fromGeometry(treesGeometry);
    return new THREE.Mesh( treesBufferGeometry, treeMaterial);
}

```

As you see first a `geometriesContainer` is created, then each tree is transformed in a `THREE.Geometry` instance and merged into the container. After that, in the method `createTrees` the `THREE.Geometry` is converted to a `THREE.BufferGeometry`. I did not create directly a `THREE.BufferGeometry` for each tree because it is not possible to merge BufferGeometries, only Geometry instances can be merged. I've merged all the trees in a single mesh to gain performances, and it works pretty well. This is a screenshot of the final result.

![final](/assets/media/posts/desert.png)
