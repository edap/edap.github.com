/* eslint-env browser */
import * as THREE from 'three';
import $ from 'jquery';
import Gui from './gui.js';
import Stats from 'stats.js';
import { createPath } from './path.js';
import Scenography from './scenography.js';
import Pool from './pool.js';
import { materials } from './materials.js';
import ColorChanger from './colorChanger.js';

//orbit controls is used just in the debug modus
const OrbitControls = require('three-orbit-controls')(THREE);
const colorChanger = new ColorChanger();
const debug = false;
const bgColor = new THREE.Color(0.1, 0.1, 0.1);
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
	mouseY,
	light;

//curve
const curveDensity = 600; // how many points define the path
const t = 0;
const radius = 200;
const radius_offset = 30;

// objects
const poolSize = 5;
const percent_covered = 0.18; // it means that objects will be placed only in the
// 18% part of the curve in front of the camera.

// the distance_from_path defines how far away from the path a palm could be
const distance_from_path = 20;

const prepareGeometries = () => {
	spline = createPath(radius, radius_offset);
	scene = new THREE.Scene();
	// TODO re-add fog
	scene.fog = new THREE.FogExp2( bgColor.getHex(), 0.016, 100 );
	scene.background = bgColor;
	pool = new Pool(poolSize, scene, spline, percent_covered, distance_from_path, materials);
	return pool;
};

const init = () => {
	prepareGeometries();
	startTime = clock.getElapsedTime();
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.3, 260);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	//renderer.setClearColor(0xff5050, 0); // the default
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
	scenography = new Scenography(camera, spline, t, gui, mouseY);
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

	window.addEventListener('mousemove', (e) => {
		let x = e.clientX/window.innerWidth;
		let y = e.clientY/window.innerHeight;
		mouseY = y;
		colorChanger.update(x, y);
	})

	addStats(debug);
	animate();
};

const animate = () => {
	requestAnimationFrame(animate);
	stats.begin();
	scenography.update(gui, mouseY);
	pool.update(scenography.getCameraPositionOnSpline());
	render();
	stats.end();
}

const render = () => {
	renderer.render(scene, camera);
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

init();
