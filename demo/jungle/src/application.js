/* eslint-env browser */
import * as THREE from 'three';
import $ from 'jquery';
import Gui from './gui.js';
import Stats from 'stats.js';
import { createPath } from './path.js';
import Scenography from './scenography.js';
import Pool from './pool.js';
import { fragmentShader, vertexShader } from './shaders.js';
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
	current_time,
	sprite,
	light;

const materialTrunk = new THREE.MeshStandardMaterial({
	color: 0xffffff,
	emissive: 0x000000,
	roughness: 0.55,
	metalness: 0.89,
	vertexColors: THREE.NoColors
});

const materialFoliage = new THREE.MeshStandardMaterial({
	color: 0xffffff,
	emissive: 0x000000,
	roughness: 0.55,
	metalness: 0.89,
	vertexColors: THREE.NoColors
});

//camera
const cameraZposition = 100;
const cameraHeight = 27;
const cameraSpeed = 0.0001;
const curveDensity = 600; // how many points define the path

//curve
const t = 0;
const radius = 200;
const radius_offset = 80;

// objects
const poolSize = 28;
const percent_covered = 0.18; // it means that objects will be placed only in the
// 20% part of the curve in front of the camera. It has to be tuned with the fog
const distance_from_path = 30;

current_time = 0;
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
	scene.fog = new THREE.FogExp2(0x000000, 0.01);
	pool = new Pool(poolSize, scene, spline, percent_covered, distance_from_path, materialFoliage, materialTrunk);
	return pool;
};

const init = sound => {
	startTime = clock.getElapsedTime();
	removeLoadingButton();
	sound.play();

	camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.3, 260);
	camera.add(listener);

	renderer = new THREE.WebGLRenderer({ antialias: true });
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
	scenography = new Scenography(camera, spline, t, cameraHeight, gui.params.cameraSpeed, materialTrunk, materialFoliage, fadeToWhite);
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
	//addPathToScene(scene, spline);
	render();
};

const render = () => {
	const time = clock.getElapsedTime() - startTime;
	stats.begin();
	scenography.update(gui.params.cameraSpeed, gui.params.sceneId, time);
	pool.update(scenography.getCameraPositionOnSpline());
	renderer.render(scene, camera);
	stats.end();
	requestAnimationFrame(render);
};

const addPathToScene = (scene, curve) => {
	const geometry = new THREE.Geometry();
	geometry.vertices = curve.getPoints(curveDensity);
	const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
	// Create the final object to add to the scene
	const curveObject = new THREE.Line(geometry, material);
	scene.add(curveObject);
};

const addStats = debug => {
	if (debug){
		document.body.appendChild(stats.domElement);
	}
};

const addGui = (debug, ambientLight) => {
	if (debug){
		gui = new Gui(materialFoliage, materialTrunk);
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
	// augment the light intensity
	light.intensity += 1;
	const inc = 1;
	// increment the bg color from black to white
	if (bgColor.r < 255){
		bgColor.r += inc;
		bgColor.g += inc;
		bgColor.b += inc;
		console.log(bgColor);
		renderer.setClearColor(bgColor.getHex());
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

const getMaterial = fog => {
	const screenResolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
	const tmp_uniforms = {
		time: { value: 1.0 },
		magAudio: { value: 0.0 },
		amplitude: { value: 0.0 },
		displacement: { value: 0.0 },
		minColor: { value: 0.6 },
		maxColor: { value: 0.9 },
		saturation: { value: 0.2 },
		fogDensity: { type: 'f', value: fog.density },
		fogColor: { type: 'c', value: fog.color },
		brightness: { value: 0.0 },
		color: { type: 'c', value: new THREE.Color(0xff3322) },
		uResolution: { value: screenResolution }
	};
	const material = new THREE.ShaderMaterial({
		uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, tmp_uniforms]),
		lights: true,
		fog: true,
		vertexShader: vertexShader(),
		fragmentShader: fragmentShader()
	});
	return material;
};

const maybeChangeScene = time => {
	current_time = time;
};

addPlayButton();
