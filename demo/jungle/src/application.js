/* eslint-env browser */
import * as THREE from 'three';
import $ from 'jquery';
import Gui from './gui.js';
import Stats from 'stats.js';
import { createPath } from './path.js';
import Scenography from './scenography.js';
import Pool from './pool.js';
import { fragmentShader, vertexShader } from './shaders.js';
import { materials, makeMaterialBrighter } from './materials.js';

// for apeunit, increase this value if you want that the scene becomes
// brighter in less time
const LIGHT_INCREASE = 0.01;
const REDIRECT_URL = 'http://www.apeunit.com/en/';

//orbit controls is used just in the debug modus
const OrbitControls = require('three-orbit-controls')(THREE);
const audio = false;
const debug = true;
const bgColor = new THREE.Color(0, 0, 0);
const clock = new THREE.Clock();

let gui,
	scene,
	renderer,
	stats,
	pool,
	scenography,
	controls,
	camera,
	spline,
	startTime,
	sprite,
	light;

//curve
const curveDensity = 600; // how many points define the path
const t = 0;
const radius = 200;
const radius_offset = 80;

// objects
const poolSize = 28;
const percent_covered = 0.18; // it means that objects will be placed only in the
// 20% part of the curve in front of the camera. It has to be tuned with the fog
const distance_from_path = 30;

const listener = new THREE.AudioListener();
const sound = new THREE.Audio(listener);

const loadPlayer = url =>
	new Promise((resolve, reject) => {
		sprite = new THREE.TextureLoader().load('../particle1.jpeg');
		const audioLoader = new THREE.AudioLoader();
		audioLoader.load(
			url,
			//success callback
			audioBuffer => {
				prepareGeometry();
				sound.setBuffer(audioBuffer);
				sound.setLoop(true);
				sound.setVolume(1);
				resolve(sound);
			},
			//progress callback
			xhr => {
				console.log(`${xhr.loaded / xhr.total * 100}% loaded`);
			},
			//error callback
			error => {
				console.log(`error while loading audio: ${filename}`);
				reject(error);
			}
		);
	});

const prepareGeometry = () => {
	spline = createPath(radius, radius_offset);
	scene = new THREE.Scene();
	pool = new Pool(poolSize, scene, spline, percent_covered, distance_from_path, materials);
	return pool;
};

const init = sound => {
	startTime = clock.getElapsedTime();
	removeLoadingButton();
	sound.play();

	camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.3, 260);
	camera.add(listener);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setClearColor(0x000000, 0); // the default
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.style.margin = 0;
	document.body.appendChild(renderer.domElement);
	if (debug){
		controls = new OrbitControls(camera, renderer.domElement);
	}
	light = new THREE.HemisphereLight(0xe8e8e8, 0x000000, 10);
	scene.add(light);
	addGui(debug, light);

	//scenography
	scenography = new Scenography(camera, spline, t, gui.params.cameraSpeed, fadeToWhite);
	//stats
	stats = new Stats();
	stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom

	window.addEventListener('resize', () => {
		let WIDTH = window.innerWidth,
			HEIGHT = window.innerHeight;
		renderer.setSize(WIDTH, HEIGHT);
		camera.aspect = WIDTH / HEIGHT;
		camera.updateProjectionMatrix();
	});

	addStats(debug);
	render();
};

const render = () => {
	const time = clock.getElapsedTime() - startTime;
	stats.begin();
	scenography.update(gui.params.cameraSpeed, gui.params.stop, time);
	pool.update(scenography.getCameraPositionOnSpline());
	renderer.render(scene, camera);
	stats.end();
	requestAnimationFrame(render);
};

const addStats = debug => {
	if (debug){
		document.body.appendChild(stats.domElement);
	}
};

const addGui = (debug, ambientLight) => {
	if (debug){
		gui = new Gui(materials);
		gui.addScene(scene, ambientLight, renderer);
	}
};

const addLoadingButton = () => {
	const div = document.createElement('div');
	div.setAttribute('id', 'loadingButton');
	div.style.cssText = 'position:fixed;height:144px;width:144px;z-index:10000;top:44%;left:46%;background-image:url(../spinner.svg)';
	document.body.appendChild(div);
};

const removeLoadingButton = () => {
	const elem = document.getElementById('loadingButton');
	if (elem){
		elem.parentNode.removeChild(elem);
	}
};

const fadeToWhite = () => {
	if (bgColor.r < 1.0){
		bgColor.r += LIGHT_INCREASE;
		bgColor.g += LIGHT_INCREASE;
		bgColor.b += LIGHT_INCREASE;
		renderer.setClearColor(bgColor.getHex());

		for (let i = 0; i < materials.length; i++){
			makeMaterialBrighter(materials[i], LIGHT_INCREASE);
		}
	} else if (!debug){
		window.location.replace(REDIRECT_URL);
	}
};

const addPlayButton = () => {
	const div = document.createElement('div');
	div.setAttribute('id', 'startButton');
	div.style.cssText = 'position:fixed;height:64px;width:64px;z-index:10000;top:48%;left:48%;background-image:url(../Play.svg)';
	div.onclick = function(){
		addLoadingButton();
		loadPlayer('../apeunit.mp3')
			.then(
				player => {
					init(player);
				},
				err => {
					console.log(err);
				}
			)
			['catch'](error => {
				console.error(error.stack);
			});
		const elem = document.getElementById('startButton');
		return elem.parentNode.removeChild(elem);
	};
	document.body.appendChild(div);
};

addPlayButton();
