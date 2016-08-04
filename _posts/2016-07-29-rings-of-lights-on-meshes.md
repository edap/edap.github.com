---
layout: post
title: "rings of lights on meshes"
category:
tags: [threejs, openFrameworks, GLSL, Maximilian]
description: "Some notes about the idea and the process behind this <a href='/demo/rings'>demo</a> I've started to work thinking that it could be nice to put some rings that move up and down on the trees, maybe in sync whith music."
---

<script type="text/javascript" src="https://rawgit.com/patriciogonzalezvivo/glslCanvas/master/build/GlslCanvas.js"></script>
Some notes about the idea and the process behind this [demo](/demo/rings).
I've started to work thinking that it could be nice to put some rings that move up and down on the trees, maybe in sync whith music.
![draw](/assets/media/posts/rings/draw.jpg)
Using [ofxLsystem](https://github.com/edap/ofxLSystem) was pretty easy to have a mesh containing a forest of ~80 trees, all I need to do is to put rings on them.


## The rings

After reading the wonderful [The book of shaders](https://thebookofshaders.com/), and especially the chapter dedicated to the shaping [functions](https://thebookofshaders.com/05/), I've decided to use a shader to draw the ring on the surface of the trees. 
In the book was linked this [example](https://thebookofshaders.com/edit.php#05/cubicpulse.frag), that uses a function called `cubicPulse` by Iñigo Quiles to create a smooth effect.
<canvas class="glslCanvas" data-fragment-url="/assets/media/posts/rings/cubic_pulse.frag"  width="960" height="300"></canvas>
```c
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

//  Function from Iñigo Quiles 
//  www.iquilezles.org/www/articles/functions/functions.htm
float cubicPulse( float c, float w, float x ){
    x = abs(x - c);
    if( x>w ) return 0.0;
    x /= w;
    return 1.0 - x*x*(3.0-2.0*x);
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution;
    // now the ring is moving following the time, it has to move following the sound!
    float y = cubicPulse(mod(u_time,0.99),0.2,st.y);
    vec3 color = vec3(y);
    color = color*vec3(0.0,1.0,0.0);
    gl_FragColor = vec4(color,1.0);
}
```


## The mesh containing the trees
I did not want to apply a shader for each tree because it could have been slow, also considering that I will need to continuously update the uniform containing the current sound amplitude to have the rings moving in sync with the music. That's why, in openFrameworks, I've merged all the trees in a single mesh.This mesh will be loaded later in the threeJS sketch.

```cpp
for(int i = 0; i<nTree; i++){
    ofxLSystem tree;
    tree.setAxiom("A(100)");
    tree.setRules({"A(s) -> F(s)[+A(s/R)][-A(s/R)]"});
    tree.setRandomYRotation(true);
    tree.setConstants(constants);
    tree.setStep(abs(ofRandom(5, 10)));
    tree.setScaleWidth(true);
    tree.setStepWidth(abs(ofRandom(30.5, 40.5)));
    tree.setStepLength(abs(ofRandom(150,300)));
    tree.build();
    tree.pan(ofRandom(30.00, 330.00));
    auto pos = ofVec2f(ofRandom(-halfScreen, halfScreen),
            ofRandom(-halfScreen, halfScreen));

    tree.setPosition(ofVec3f(pos.x, 0, pos.y));
    for (int i=0; i<tree.getMesh().getNumVertices(); i++) {
        auto actualVert =tree.getMesh().getVerticesPointer()[i];
        auto newVert = actualVert * tree.getGlobalTransformMatrix();
        tree.getMesh().getVerticesPointer()[i] = newVert;
    }
    forest.append(tree.getMesh());
}
```

In [this repository](https://github.com/edap/ofxLSystem), in the folder "example-rings" you can find the whole openFrameworks application, shaders and onset detection included.
The mesh was still pretty big, as I do not need high resolution, I've used meshLab to simplyfy the mesh.


## The sound

[Maximilian](http://maximilian.strangeloop.co.uk/) is not only a c++ library that can be easily integrated with openFrameworks using [ofxMaxim](https://github.com/micknoise/Maximilian/tree/master/openFrameworks/ofxMaxim), but it has also a javascript port that simplifies a lot working with sound in the browser.

To play a sample in with Maximilian is super easy.

```javascript
var maxiAudio = new maximJs.maxiAudio(); // the maxi audio object
var sample = new maximJs.maxiSample(); // object that will contain the song loaded
var ctx = new AudioContext(); // the audio context. see http://www.html5rocks.com/en/tutorials/webaudio/intro/

//loading the sound and the mesh
$.when(
        maxiAudio.loadSample('beat.wav', sample, ctx),
        loadPly('tree.ply')
      ).then(
        function (_, treePly) {
            init(treePly);
            animate();
        },
        function (error) {
            console.log(error);
        }
);
```

In the `init` method I've added a method called `initAudio` that plays the sample

```javascript

function initAudio(){
    maxiAudio.init();
    // I need the output as an array later
    maxiAudio.outputIsArray(true, 2);
    maxiAudio.play = function(scenography) {
        var wave1 = sample.play();
        var mix = wave1 * config.volume; // in case you have other samples, just add them here: var mix =  wave1 +wave2;
        this.output[0] = mix;
        this.output[1] = this.output[0];
        var left = this.output[0];
        var right = this.output[1];
    }
}

```

The function `maxiAudio.loadSample` sets the variable `sample`. The third parameter `ctx` is the AudioContext created at the beginning. In the init method of the threejs sketch I call `initAudio`. This function get called only once, but the content of the loop `maxiAudio.play = function() {` get executed until we close the page. This is related to the nature of the `AudioContext`. There is a good introduction of Web Audio API at this [page](http://www.html5rocks.com/en/tutorials/webaudio/intro/)

## Beat detection
What i wanted to do is to move the rings up and down depending on the music. The easiest way is to implement an onset detection, a way to find "the beat", the moment when the sound "kicks". I've used Root Mean Square calculation (RMS), there is a nice explanation of it in the [ofBook](http://openframeworks.cc/ofBook/chapters/sound.html). I've edited the `initAudio` method setting the value of `rms` as follow:

```javascript
function initAudio(){
    maxiAudio.init(); //initialize the maxiAudio
    maxiAudio.outputIsArray(true, 2); // the output is an array containing 2 channels, left and right
    maxiAudio.play = function() {
        bufferCount++;
        var wave1 = sample.play(); // play the sample
        var mix = wave1 * config.volume; // in case you have other samples, just add them here: var mix =  wave1 +wave2;
        this.output[0] = mix;
        this.output[1] = this.output[0];
        // in case we want to do smth else in the future with the current bufferOut
        bufferOut[bufferCount % 1024] = mix;
        var left = this.output[0];
        var right = this.output[1];
        rms += left * left;
        rms += right * right;
        examplesCounted += 2;
    }
}
```

later, in the `animate` function of the threejs sketch i've smoothed the `rms` value, and updated the related uniform.

```javascript
function calcRms(bufferOut) {
    if (bufferOut.length === 1024) {
        rms /= examplesCounted;
        rms = Math.sqrt(rms);

        threshold = lerp(threshold, this.config.minTreshold, this.config.decayRate);
        if (rms > threshold) {
            threshold = rms;
        }
        treeMaterial.uniforms.rms.value = threshold;
    }
}
```

## Sound and shader

Unsing a `sin(u_time)` in the previous shader, the rings are moving like this:

![rings](/assets/media/posts/rings/rings.gif)

To move the the ring up and down I've first to identify a 0 value on the y axis, then add a uniform containing the previously calculated `rms` value, decide how tick the ring will be , calculating the padding between the rings and finally draw as many ring as desidered.
To simply draw a ring at the base of the mesh, that moves up and down following the rms value, i can modify the previuos shader like this:

```c
vec4 tmpCol = vec4(treeColor, 1.0);
float y = cubicPulse(mod(rms * scaleRing, 1.0),ringThickness,screenY);
tmpCol += vec4( vec3( dProd ) *vec3( y ) * vec3(ringColor), y);
```

`treeColor` is the color of the tree, `rms` is the currently calculated rms, `scaleRing` is a value used to amplify the movement of the ring, `ringThickness` is a value that decide the thickness of the ring, and screenY is a value calculated in the vertex shader with `screenY  = position.y/uResolution.y`, that determinates the initial position of the ring. You can change all these uniforms in the demo, pressing `g` to see how they affect it.

To draw more than one ring I've used a loop. Compared to OpenGL, WebGL has some limitations for loop. In webGL, the upper limit of the loop has to be a declared constant, `MAX_NUM_RINGS` in my shader. When the shader compile, this loop is unrolled as many time as defined in that constant. To execute the instruction contained in the loop as many time as defined in the uniform `ringNumber`, I've to break the loop at the desidered value.

```c
#define MAX_NUM_RINGS 18
for (int i = 0; i< MAX_NUM_RINGS; i++) {
  if (i == ringNumber ) break;
  //draw the ring!
end
```

The distance between each ring is stored in the variable `padding` and it depends on how many rings are currently drawn. It is calculated like this:

```c
float inc = 1.0/float(ringNumber);
float padding = 0.0;
//arbitrary light position
vec3 lightPos = vec3(0.5, 0.2, 0.5);
vec3 lightDirection = normalize(vecPos.xyz - lightPos);
float dProd = max(0.6,dot(vecNormal, lightDirection));

vec4 tmpCol = vec4(treeColor, 1.0);
for (int i = 0; i< MAX_NUM_RINGS; i++) {
  if (i == ringNumber ) break;
  float y = cubicPulse(mod(rms * scaleRing, 1.0),ringThickness,screenY - padding);
  //apply light only to the rings
  tmpCol += vec4( vec3( dProd ) *vec3( y ) * vec3(ringColor), y);
  padding +=inc;
}
gl_fragColor = tmpCol;
```

Fragment and Vertex shaders are both available in the [repository](https://github.com/edap/edap.github.com/blob/master/demo/rings/index.html)

![draw](/assets/media/rings/yellow-medium.png)
