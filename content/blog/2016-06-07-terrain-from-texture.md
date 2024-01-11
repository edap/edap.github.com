---
layout: blog-post
title: "demo: terrain with a road from a texture"
date: "2016-06-07"
tags:
- Javascript
- Shaders
- Three.js
- WebGL
---

In the last days I was looking for a way to draw a terrain with a closed road were the camera can move along. I've taken into consideration these 3 approaches:

* Generate the terrain geometry using noise, then build a path where the camera can move around.
* Download an height-map from the web, possible an height-map that contains a street, or a river, and use that street or river as a path for the camera.
* Generate the terrain from an image containing Perlin noise.

I went for the latter one, mostly because it was easy to draw a path on it and use it for the camera. The demo example is [here]({{site.url}}/demo/terrain). The source code is available on my [github repository](https://github.com/edap/edap.github.com/tree/master/demo/terrain). I've taken some notes during the development, maybe someone can find them helpful.

## Generate the texture with gimp

I've created the image using Gimp. New image then -> "advanced options" -> "Grayscale". Then filter -> render -> clouds -> solid noise. I've set "detail" to 10 and X size and Y size to 10.
Then I've selected "Color" -> "Brightness-Contrast" and I've increased the contrast. The goal was to have more black areas close to each other, to connect them later and form a path. I've ended up with an image like this:

![no-path](/img/posts/terrain/terrain-no-path.png)

With the path tool in Gimp I've drawn a closed path that connects the dark regions of the picture. I haven't used a bezier curve, there was no need to stretch the point in order to obtain a smooth curve, the curve type that I've used later will make a smooth curve.

* Right click -> edit -> Stroke Path -> stroke with a paint tool. I've selected the brush tool and the black color, then "Stroke". The result is the image on the right.
* I've selected Window -> Dockable dilaog -> path. I've selected the path and I've saved it as `path.svg`. This is the path along with the camera will be moved later.

![path](/img/posts/terrain/terrain-path.png)

## Load the texture and generate the heights

I've created a plane geometry and I've associated the texture to it.

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
```

## Vertical displacement in the vertex shader

The black pixel in the texture are the lowland and the white pixel are the highest part of the mountain. The gray areas between them interpolates between those two regions. In the vertex shader, the vertices are displaced along the normal of the plane depending on the shade of gray.  These are the two snippets containing the vertex and the fragment shaders code:

Vertex shader code:

```c
uniform sampler2D bumpTexture;
uniform float bumpScale;
varying float vAmount;
varying vec2 vUV;

void main() {
  vUV = uv;
  vec4 bumpData = texture2D( bumpTexture, vUV );
  vAmount = bumpData.r; // as the texture is grayscale, r,g and b have the same values.

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
  gl_FragColor = vec4(vAmount * 1.);
}
```

## Create the path

In order to load the svg file to create the spline along which the camera will move, I have to scale my gimp xfc project to have the same dimension of the geometry plane. I've created a plane that is 2048x2048, and I've scaled my gimp image accordingly (click on image -> scale, the path will be automatically scaled too). 

I've loaded the svg file (see the code in the demo about how to load resources using promises), then I've parses the svg file to find out the coordinates of the vertices that will compose the path.
Gimp automatically export any svg path in a bezier curve. That means that every point in the svg file is composed by 3 couple of x y coordinates. The first and the last couple are the handles of the point, and the second point is the middle point in the bezier curve. Bezier curve are a nice way to represent curves, but in my case it is just more complexity during the parsing of the svg when creating the curve. To keep the things simple, for every point composing the curve, I've discarded the coordinates of the handles, I've taken only the middle point and I've used all these middle points to create a Catmull-Rom spline. ThreeJS provide a class that abstracts this type of curve and also calculates the interpolated position of each point between the points defined in gimp. When creating the geometry out of these vertices, I've used `getSpacedPoints`, to have equidistant points, otherwise the camera will scatter along the points, going slower where there are more points composing the curve, and going faster when there are less point.

This is how the svg looks like in the developer tools.

![no-path](/img/posts/terrain/get_svg.png)

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

## Move the camera along the path

To move the camera along the path I've changed the position of the camera a bit forward everytime the function `render` is called.
When the position of the camera is close to the end of the path, it is repositioned at the beginning.
In the line where `lookAt` is used, the camera is turned in the direction of the next position that the camera will have, so that it will always looks ahead. I've chosen to look 20 points forward to have the camera turning smoothly. If I would have chosen a value like 2 instead of 20, for each step forward, the rotations on the `y` axis would have been bigger, and the camera would have been too much instable. I've introduced a control over the `lookAtPoint` because when the lookAt point islnear to the end of the path the camera was looking back for a moment before to come back in the right position.

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

To add the background I've preferred to use a [skydome](http://www.ianww.com/blog/2014/02/17/making-a-skydome-in-three-dot-js/) instead a [skybox](https://aerotwist.com/tutorials/create-your-own-environment-maps/). It is simpler and and in my case it fits perfectly my needs because most of the time the mountains are covering the sky. It is possible to obtain nice effects with only one small texture, in my example the texture is only 128x128 px. The method that take care of the background is called `createSkyBox`.

## Press the spacebar for a barking dog

This sketch has 2 modes, one with a the sound of barking dog and another without it. The variable in which the mode is saved is called, with no surprise, `barkingDog`, and its status get swapped pressing the spacebar.
To move the camera up and down, i've applied a `sin` movement on the `y` axis of the camera. I've defined a camera height, and a maximum height position that is equal to `cameraHeight * 1.2`.

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


![no-path](/img/posts/terrain/path_and_bg.png)


## Texture splatting

I've collected the textures during a trip in Sächsische Schweiz. Mostly rock's surfaces around an area called "Affenstein". To obtain a texture out of a picture I've opened Gimp and then Filter -> Map -> Make Seamless. Then I've resized the picture to 512x512. In the [Stemkoski website](http://stemkoski.github.io/Three.js/Shader-Heightmap-Textures.html) there is a nice example about how to use texture splatting in ThreeJS using the `smoothstep` function in the fragment shader, I've basically followed that structure. It is pretty important to understand how to interpolate nicely the textures, I've drawn this orrible graph that tries to show how the overlapping of 2 curves is essential to merge the textures smoothly together. 

![no-path](/img/posts/terrain/texture-splatting.jpg)


## Add the trees

All the trees are created using the geometry. The geometry is created using openFrameworks and my addon [ofxLSystem](https://github.com/edap/ofxLSystem). As the only thing that differentiates a tree from another is its location, rotation and scale, this is a good case to create an instanced mesh. As the trees are just along the track, they are added only if a random position close to the track is overlapping with a portion of the noise texture that is not white. If the pixel is black it means there are no mountains at that coordinates, and the tree can be put there.
The coordinates of the points on the path are in a different scale and position than the coordinate of the texture (my path was on a surface of 2048x2048, translated on the y and x axis and rotated, the texture has not translation nor rotation and it is 512x512), that's why there are coordinate conversions in this method:

```javascript
function createTrees(ofMesh, fog, bumpTexture){
    treeMaterial = createTreeMaterial(fog);
    var treesInstanceBufferGeometry = createTreesGeometry(ofMesh, bumpTexture);
    var mesh = new THREE.Mesh( treesInstanceBufferGeometry, treeMaterial);
    mesh.frustumCulled = false; // necessary, otherwise three get culled out when the camera turns
    return  mesh;
}

// https://threejs.org/examples/webgl_buffergeometry_instancing2.html
function createTreesGeometry(ofMesh, bumpTexture){
    var density = 1; // n trees pro point in curve
    var context = createCanvasContext(bumpTexture);
    // ratio between the geometry plane and the texture
    var ratio = side / bumpTexture.image.width;

    ofMesh.computeFaceNormals();
    ofMesh.computeVertexNormals();

    var instancePositions = [];
    var instanceQuaternions = [];
    var instanceScales = [];

    var tree = new THREE.Geometry();
    tree.merge(ofMesh);
    var geometry = new THREE.BufferGeometry().fromGeometry(tree);
	var quat = new THREE.Quaternion();
	var upVector = new THREE.Vector3(0,1,0);
    for (var i = 0; i< spline.points.length; i++) {
        var pos = spline.points[i];
        for (var d = 0; d <= density; d++) {
            var randX = Math.floor(pos.x + getRandomArbitrary(-maxDistanceFromPath, +maxDistanceFromPath));
            var randY = Math.floor(pos.z + getRandomArbitrary(-maxDistanceFromPath, +maxDistanceFromPath));

            var x = Math.floor((randX + side/2) / ratio);
            var y = Math.floor((randY + side/2) / ratio);
            // put thress only where there are no mountains (eg, the pixel is black)
            if (context.getImageData(x, y, 1, 1).data[0] === 0) {
                var randomScalar = getRandomArbitrary(0.03, 0.07);
                quat.setFromAxisAngle( upVector, Math.PI / getRandomArbitrary(-3, 3) );

                instancePositions.push( randX, (pos.y - cameraHeight), randY );
                instanceQuaternions.push( quat.x, quat.y, quat.z, quat.w );
                instanceScales.push( randomScalar, randomScalar, randomScalar );
            }
        }
    }

    var instancedGeometry = new THREE.InstancedBufferGeometry();
    instancedGeometry.attributes.position = geometry.attributes.position;
    instancedGeometry.attributes.color = geometry.attributes.color;

    instancedGeometry.setAttribute( 'instancePosition', new THREE.InstancedBufferAttribute( new Float32Array( instancePositions ), 3 ) );
    instancedGeometry.setAttribute( 'instanceQuaternion', new THREE.InstancedBufferAttribute( new Float32Array( instanceQuaternions ), 4 ) );
    instancedGeometry.setAttribute( 'instanceScale', new THREE.InstancedBufferAttribute( new Float32Array( instanceScales ), 3 ) );    
    return instancedGeometry;
}

```

The matrix transformations are now passed as attribute to the vertex shader, that can scale, rotate and translate the instances. The vertex shader code needs consequentially to be adapted.

```c
precision highp float;

attribute vec3 instancePosition;
attribute vec4 instanceQuaternion;
attribute vec3 instanceScale;

varying vec3 vNormal;
varying vec3 vPos;

vec3 applyTRS( vec3 position, vec3 translation, vec4 quaternion, vec3 scale ) {
  position *= scale;
  position += 2.0 * cross( quaternion.xyz, cross( quaternion.xyz, position ) + quaternion.w * position );
  return position + translation;
}

void main(){
  vNormal = normalMatrix * normal;

  vec3 transformed = applyTRS( position.xyz, instancePosition, instanceQuaternion, instanceScale );
  // as the light later will be given in world coordinate space,
  // vPos has to be in world coordinate space too
  vPos = (modelMatrix * vec4(transformed, 1.0 )).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( transformed, 1.0 );
}
```

Here a screenshot of the final result and the link to the a [live demo](/demo/terrain).

![final](/img/posts/terrain/desert.png)
