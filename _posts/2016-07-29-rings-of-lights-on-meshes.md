---
layout: post
title: "rings of lights on meshes"
category: 
tags: [threejs, openFrameworks, GLSL, Maximilian]
---
<script type="text/javascript" src="https://rawgit.com/patriciogonzalezvivo/glslCanvas/master/build/GlslCanvas.js"></script>

I was thinking that it could be nice to put some rings moving up and down on the trees, maybe mooving in sync whith some nice beat sound.  
![draw](/assets/media/posts/rings/draw.jpg)
Using [ofxLsystem](https://github.com/edap/ofxLSystem) was pretty easy to have a mesh containing a forest of ~80 trees, all I need to do is to put rings on them.


## The rings

After reading the wonderful [The book of shaders](https://thebookofshaders.com/), and especially the chapter dedicated to the shaping [functions](https://thebookofshaders.com/05/), I've decided to use a shader to draw the ring on the surface of the trees. 
In the book was linked this [example](https://thebookofshaders.com/edit.php#05/cubicpulse.frag), that uses a function `cubicPulse` by Iñigo Quiles, that create a smooth effect.
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
    // now the ring is moving followin the time, it has to move following the sound!
    float y = cubicPulse(mod(u_time,0.99),0.2,st.y);
    vec3 color = vec3(y);
    color = color*vec3(0.0,1.0,0.0);
    gl_FragColor = vec4(color,1.0);
}
```


## The mesh
I did not want to apply a shader for each tree,it could have been slow, also considering that I will need to update a uniform containing the current sound amplitude to have the rings moving in sync with the music, that's why, in openFrameworks, I've merged all the trees in a single mesh.This mesh will be loaded in the threeJS sketch.

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

In [this repository](https://github.com/edap/ofxLSystem), in the folder "example-rings" you can find the whole openFrameworks application, shaders and on-set detection included.

## The sound

I was learning [Maximilian](http://maximilian.strangeloop.co.uk/) recently, and through the course "[creative programming for audiovisual art](kadenze.com/courses/creative-programming-for-audiovisual-art)" I've discovered that there is also a javascript port of that library, that simplify a lot working with sound in the browser. 

First, some variables has to be defined and the sample has to be loaded.

```javascript
var maxiAudio = new maximJs.maxiAudio(); // the maxi audio object
var sample = new maximJs.maxiSample(); // object that will contain the song loaded
var ctx = new AudioContext(); // the audio context. see http://www.html5rocks.com/en/tutorials/webaudio/intro/

//needed for rms calculation
var bufferCount = 0;
var bufferOut = [];
var rms = 0;
var examplesCounted = 0;
var smoothedVolume = 0;

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

The function `maxiAudio.loadSample` sets the variable `sample`. The third parameter `ctx` is the AudioContext created at the beginning. In the init method of the threejs sketch I call `initAudio`. This function get called only once, but the content of the loop `maxiAudio.play = function() {` get executed until we close the page. This is related to the nature of the `AudioContext`. There is a good introduction of Web Audio API at this [page](http://www.html5rocks.com/en/tutorials/webaudio/intro/)

In this loop I've set the value of `rms`, that means Root Mean Square, and is a roughly way to have onset detection, also knowed as beat detection. There is a simple explanation of it in the [ofBook](http://openframeworks.cc/ofBook/chapters/sound.html). 

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
    //just check that the buffer is full
    if (bufferOut.length === 1024) {
        rms /= examplesCounted;
        rms = Math.sqrt(rms);
        smoothedVolume *= smoothedVolume;
        smoothedVolume = rms;
        treeMaterial.uniforms.rms.value = smoothedVolume;
    }
}
``` 

## Sound and shader

Position of the ring (screen coordinates)

Tuning (ring Thickness, responsiveness)

Loop, spiegare il perche' del break

## All together
