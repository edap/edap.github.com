/* eslint-env browser */
import * as THREE from 'three';
import $ from "jquery";
import Tone from 'tone';
import Gui from './gui.js';
import Stats from 'stats.js';
import {createPath} from './path.js';
import {loadAudio} from './audio_loader.js';
import Scenography from './scenography.js';
import Pool from './pool.js';
import {fragmentShader, vertexShader} from './shaders.js';
const OrbitControls = require('three-orbit-controls')(THREE);
import {PointLights} from './pointLights.js';

const debug = false;
let gui, scene, renderer, stats, pool, scenography, controls, camera, spline, current_time, clock, sprite;
let palmMaterial;

//camera
let cameraZposition = 100;
let cameraHeight = 27;
let cameraSpeed = 0.0001;
let curveDensity = 600; // how many points define the path

//curve
let t = 0;
const radius = 200;
const radius_offset = 80;

// objects
const poolSize = 28;
const percent_covered = 0.18; // it means that objects will be placed only in the
// 20% part of the curve in front of the camera. It has to be tuned with the fog
const distance_from_path = 30;

// AUDIO
current_time = 0;
let fftSize=32;
let fft = new Tone.Analyser("fft", fftSize);
function loadPlayer(url){
    return new Promise(function(resolve, reject){
        let player = new Tone.Player(url).fan(fft).toMaster();
        sprite = new THREE.TextureLoader().load( "../particle1.jpeg" );
        player.loop = false;
        player.autstart = false;
        Tone.Buffer.on("load", function(){
            console.log("tutt");
            //tutte cose
            prepareGeometry();
            resolve(player);
        }, function(){
            reject("smth went wrong");
        });
    });
};

addPlayButton();

function prepareGeometry(){
    spline = createPath(radius, radius_offset);
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0x000000, 0.01 );
    palmMaterial = getMaterial(scene.fog);
    pool = new Pool(poolSize, scene, spline, percent_covered, distance_from_path, palmMaterial);
    return pool;
}

let counter = () => {
    ++current_time;
};

function init(player){
    removeLoadingButton();
    player.start();
    let timer = setInterval(counter, 1000);
    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.3, 260);

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.style.margin =0;
    document.body.appendChild(renderer.domElement);
    if (debug) {
        controls = new OrbitControls(camera, renderer.domElement);
    }

    //scenography
    scenography = new Scenography(camera, spline, t, cameraHeight, cameraSpeed, palmMaterial);
    //stats
    stats = new Stats();
    stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom

    //lights
    let ambientLight = new THREE.AmbientLight( 0x000000 );
    scene.add( ambientLight );

    PointLights().map((light) => {
        scene.add( light );
    });

    window.addEventListener('resize', function() {
        let WIDTH = window.innerWidth,
            HEIGHT = window.innerHeight;
        renderer.setSize(WIDTH, HEIGHT);
        camera.aspect = WIDTH / HEIGHT;
        camera.updateProjectionMatrix();
    });
    addGui(debug, ambientLight);

    addLightPath(spline, 0x00FF00);
    addStats(debug);
    //addPathToScene(scene, spline);
    render();
}

function passAudioToMaterial(values, n_bin){
    let magAudio;
		for (let i = 0, len = values.length; i < len; i++){
				let fftVal = values[i] / 255;
        fftVal = fftVal === 0 ? 0.05 : fftVal;
        fftVal = fftVal;
        if (i === n_bin) {
            magAudio = fftVal;
        }
		}
    palmMaterial.uniforms.magAudio.value = magAudio;
}

function render(){
    stats.begin();
    palmMaterial.uniforms.magAudio.needUpdate = true;
    palmMaterial.uniforms.amplitude.needUpdate = true;
    palmMaterial.uniforms.minColor.needUpdate = true;
    palmMaterial.uniforms.maxColor.needUpdate = true;
    palmMaterial.uniforms.saturation.needUpdate = true;
    palmMaterial.uniforms.brightness.needUpdate = true;
    palmMaterial.uniforms.displacement.needUpdate = true;
    scenography.update(current_time);
    pool.update(scenography.getCameraPositionOnSpline());
	  renderer.render(scene, camera);
    let bin = scenography.getSelectedBin();
    passAudioToMaterial(fft.analyse(),bin);
    stats.end();
	  requestAnimationFrame(render);
}

function addPathToScene(scene, curve){
    let geometry = new THREE.Geometry();
    geometry.vertices = curve.getPoints( curveDensity );
    let material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
    // Create the final object to add to the scene
    let curveObject = new THREE.Line( geometry, material );
    scene.add(curveObject);
}

function addStats(debug) {
    if (debug) {
        document.body.appendChild(stats.domElement);
    }
}

function addGui(debug, ambientLight){
    if (debug) {
        gui = new Gui(palmMaterial);
        gui.addScene(scene, ambientLight, renderer);
    }
}

function addLoadingButton(){
    let div = document.createElement("div");
    div.setAttribute("id", "loadingButton");
    div.style.cssText = "position:fixed;height:144px;width:144px;z-index:10000;top:44%;left:46%;background-image:url(../spinner.svg)";
    document.body.appendChild(div);
}

function removeLoadingButton(){
    let elem = document.getElementById("loadingButton");
    if (elem) {
        elem.parentNode.removeChild(elem);
    };
}

function addPlayButton(){
    let div = document.createElement("div");
    div.setAttribute("id", "startButton");
    div.style.cssText = "position:fixed;height:64px;width:64px;z-index:10000;top:48%;left:48%;background-image:url(../Play.svg)";
    div.onclick = function () {
        addLoadingButton();
        loadPlayer("../Adventura.mp3").then(
            function(player){
                init(player);
            },
            function(err){
                console.log(err);
            });
        let elem = document.getElementById("startButton");
        return elem.parentNode.removeChild(elem);
    };
    document.body.appendChild(div);
}


function getMaterial(fog){
    let screenResolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
    let tmp_uniforms = {
		    time: { value: 1.0 },
        magAudio: {value: 0.0},
        amplitude: {value: 0.0},
        displacement: {value: 0.0},
        minColor: {value: 0.6},
        maxColor: {value: 0.9},
        saturation: {value: 0.2},
        fogDensity: { type: "f", value: fog.density},
        fogColor:   { type: "c", value: fog.color},
        brightness: {value: 0.0},
        color: {type: "c", value: new THREE.Color( 0xff3322 )},
		    uResolution: { value: screenResolution }
	  };
    let material = new THREE.ShaderMaterial( {
	      uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib['lights'],
            tmp_uniforms
        ]),
        lights: true,
        fog: true,
	      vertexShader: vertexShader(),
	      fragmentShader: fragmentShader()

    } );
    return material;
}

function addLightPath( spline, color ) {
    let radiusBuffGeom = 3;
    let radiusSegmentBuffGeom =5;
    let geom = new THREE.TubeGeometry( spline, 100, radiusBuffGeom, radiusSegmentBuffGeom, true );

    let starsGeometry = new THREE.Geometry();
    starsGeometry.vertices = geom.vertices;
    for(let idx = 0; idx < starsGeometry.vertices.length; idx++){
        let offset = Math.sin(idx);
        let v0 = starsGeometry.vertices[idx];
        v0.y += offset*3;
        v0.x += offset*6;
        v0.z += offset*6;
    }

    let starsMaterial = new THREE.PointsMaterial( {
        color: 0xE0E0E0,
				size: 10,
        map:sprite,
				blending: THREE.AdditiveBlending,
				transparent: true,
				sizeAttenuation: false
    } );
    let starField = new THREE.Points( starsGeometry, starsMaterial );
    starField.scale.set(1,0.4,1);
		scene.add( starField );
}

function maybeChangeScene(time){
    current_time = time;
};

