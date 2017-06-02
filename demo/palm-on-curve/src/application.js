/* eslint-env browser */
import * as THREE from 'three';
const FileSaver = require('file-saver');
import LeafGeometry from './LeafGeometry.js';
import PalmGenerator from './PalmGenerator.js';
import Stats from 'stats.js';
import Gui from './gui.js';
import CollectionGeometries from './geometries.js';
import CollectionMaterials from './materials.js';
import Plane from './plane.js';
import {CreatePointLight, createHUD} from './pointLights.js';
import Spline from './spline.js';
const radius = 5; //this number is used to create the geometries
const geometries = new CollectionGeometries(radius);
const materials = new CollectionMaterials;
//const material = materials["standard"];
const material = materials["phong"];
const trunkMaterial = materials["standard"];
let gui;
const debug = false;

let drawMode = false;
let mouse3D = new THREE.Vector3();
let cubes = new THREE.Group();

let palm;
let spline = new Spline();

//setup the scene and the camera
const scene = new THREE.Scene();
const OrbitControls = require('three-orbit-controls')(THREE);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias:true});
const stats = new Stats();
const controls = new OrbitControls(camera, renderer.domElement);
const originalCamZ = 230;
const originalCamY = 190;

function init(){
    controls.target.set( 0, 100, 0 );
    setOrbitControlsLimits(controls);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.style.margin =0;
    document.body.style.padding =0;
    document.body.style.overflow ="hidden";
    document.body.appendChild(renderer.domElement);

    stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    //document.body.appendChild( stats.dom );
    camera.position.z = originalCamZ;
    camera.position.y = originalCamY;

    let plane = new Plane(3400, 3400, 1000);
    plane.rotateX(-Math.PI/2);
    scene.add(plane);

    //add lights to the scene
    let ambientLight = new THREE.AmbientLight( 0x34ac0f );
    scene.add( ambientLight );
    renderer.setClearColor( 0x505050 );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    let light = CreatePointLight();
    scene.add( light );
    gui = new Gui(material, trunkMaterial, rebuild, activateDraw, exportMesh);
    gui.addScene(scene, ambientLight, renderer);
    //rebuild();
    activateDraw();
    addGridHelper();

    window.addEventListener('resize', function() {
        let WIDTH = window.innerWidth,
        HEIGHT = window.innerHeight;
        renderer.setSize(WIDTH, HEIGHT);
        camera.aspect = WIDTH / HEIGHT;
        camera.updateProjectionMatrix();
    });
    window.addEventListener('keypress', maybeGuiPressed, false);
    window.addEventListener('mousedown', onMouseDown, false);
    addStats(debug);
    scene.add(cubes);
    render();
}

let exportMesh = () => {
    let json = palm.geometry.toJSON();
    let string = JSON.stringify(json);
    let blob = new Blob([string], {type: "octet/stream"});
    FileSaver.saveAs(blob, "palm.json");
}

let activateDraw = () => {
    camReset();
    spline.reset();
    removeEntityByName("palm", scene);
    removeEntityByName("text", scene);
    drawMode = true;
    controls.enabled = false;
    addCube(new THREE.Vector3(0,0,0));

	  var spritey = makeTextSprite( " Drag the cube up",
		                              { fontsize: 32} );
	  spritey.position.set(4,10,0);
    spritey.name = "text";
	  scene.add( spritey );
}

let onMouseDown = (event) => {
    if (drawMode) {
        mouse3D.set(
            ( event.clientX / window.innerWidth ) * 2 - 1,
            - ( event.clientY / window.innerHeight ) * 2 + 1,
            0.5 );

        mouse3D.unproject( camera );
        let dir = mouse3D.sub( camera.position ).normalize();
        let distance = - camera.position.z / dir.z;
        let pos = camera.position.clone().add( dir.multiplyScalar( distance ) );

        let ray = 15;
        if( pos.x < ray && pos.x > -ray &&
            pos.y > -ray && pos.y < ray) {
            removeEntityByName("text", scene);
            window.addEventListener("mousemove",onMouseMove,false);
            window.addEventListener("mouseup",onMouseUp,false);
        }
    }
}

let onMouseMove = (event) => {
    mouse3D.set(
        ( event.clientX / window.innerWidth ) * 2 - 1,
        - ( event.clientY / window.innerHeight ) * 2 + 1,
        0.5 );

    mouse3D.unproject( camera );
    let dir = mouse3D.sub( camera.position ).normalize();
    let distance = - camera.position.z / dir.z;
    let pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
    //pos.z = Math.sin(Date.now()*0.02)*6.5;
    //console.log(pos.z);

    spline.addPoint(pos);
    addCube(pos);
}

let onMouseUp = (event) => {
    if (drawMode && spline.hasPoints()) {
        for (var i = cubes.children.length - 1; i >= 0; i--) {
            cubes.remove(cubes.children[i]);
        }
        spline.generateCurve();
        window.removeEventListener("mousemove",onMouseMove,false);
        drawMode = false;
        controls.enabled = true;
        rebuild();
    }
}

let camReset = () => {
    controls.reset();
    camera.position.z = originalCamZ;
    camera.position.y = originalCamY;
}


let rebuild = () => {
    let palm_opt = {
        spread: gui.params.spread,
        angle: gui.params.angle,
        num: gui.params.num,
        growth: gui.params.growth,
        foliage_start_at: gui.params.foliage_start_at,
        trunk_regular: gui.params.trunk_regular,
        buffers: true,
        angle_open: gui.params.angle_open,
        starting_angle_open: gui.params.starting_angle_open
    };

    let leafGeometry = makeLeaf();
    let curve = spline.getCurve();
    let mesh = makePalm(leafGeometry, palm_opt,curve);
    mesh.castShadow = true;
    mesh.name = "palm";
    removeEntityByName("palm", scene);
    palm = mesh;
    scene.add( mesh );
}

function removeEntityByName(name,scene) {
    let selectedObject = scene.getObjectByName(name);
    if(selectedObject){
        scene.remove( selectedObject );
    }
}

function makePalm(leafGeometry, palm_opt,curve){
    let trunkGeometry = new THREE.BoxGeometry(5,5,5);
    palm = new PalmGenerator(leafGeometry,
                             trunkGeometry,
                             palm_opt, curve);
    let geometry = palm.geometry;
    let bufGeometry = new THREE.BufferGeometry().fromGeometry(geometry);
    let palmBuffers = palm.buffers;
    bufGeometry.addAttribute( 'color', new THREE.BufferAttribute(
        palmBuffers.color,
        3));

    bufGeometry.attributes.color.needsUpdate = true;
    let tot_vert = palmBuffers.totVertices;
    let tot_vert_foliage = palmBuffers.totFoliageVertices;

    let materials = [material, trunkMaterial];
    bufGeometry.clearGroups();
    bufGeometry.addGroup(0,tot_vert_foliage,0);
    bufGeometry.addGroup((tot_vert_foliage),tot_vert,1);
    let mesh = new THREE.Mesh(bufGeometry, materials);
    return mesh;
}

function makeLeaf() {
    let opt = {
        length: gui.params.length,
        length_stem: gui.params.length_stem,
        width_stem: gui.params.width_stem,
        leaf_width: gui.params.leaf_width,
        leaf_up: gui.params.leaf_up,
        density: gui.params.density,
        curvature: gui.params.curvature,
        curvature_border: gui.params.curvature_border,
        leaf_inclination: gui.params.leaf_inclination
    };
    return new LeafGeometry(opt);
}

function addStats(debug) {
    if (debug) {
        document.body.appendChild(stats.domElement);
    }
}

var maybeGuiPressed = function(ev) {
    if ( ev.keyCode === 103) {
        gui.toggleHide();
    }
};

function addCube(pos){
    let geom = new THREE.BoxBufferGeometry(5,5,5);
    let mat = new THREE.MeshLambertMaterial({color: 0x45ac51});
    let cube = new THREE.Mesh(geom, mat);
    cube.position.setX(pos.x);
    cube.position.setY(pos.y);
    cube.position.setZ(pos.z);
    scene.add(cube);
    cubes.add(cube);
}

function render(){
    stats.begin();

    controls.update();
    renderer.render(scene, camera);

    stats.end();
    requestAnimationFrame(render);
}


function addGridHelper(){
    var size = 800;
    var divisions = 40;
    var gridHelper = new THREE.GridHelper( size, divisions );
    scene.add(gridHelper);
}

function makeTextSprite( message, parameters ){
	if ( parameters === undefined ) parameters = {};
	let fontface = parameters.hasOwnProperty("fontface") ?
		parameters["fontface"] : "Arial";
	let fontsize = parameters.hasOwnProperty("fontsize") ?
		parameters["fontsize"] : 18;
	let borderThickness = parameters.hasOwnProperty("borderThickness") ?
		parameters["borderThickness"] : 4;
	let borderColor = parameters.hasOwnProperty("borderColor") ?
		parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
	let backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
		parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

	let canvas = document.createElement('canvas');
	let context = canvas.getContext('2d');
	context.font = "Bold " + fontsize + "px " + fontface;
	// get size data (height depends only on font size)
	let metrics = context.measureText( message );
	let textWidth = metrics.width;
	// background color
	context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
								  + backgroundColor.b + "," + backgroundColor.a + ")";
	// border color
	context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
								  + borderColor.b + "," + borderColor.a + ")";
	context.lineWidth = borderThickness;
	// 1.4 is extra height factor for text below baseline: g,j,p,q.
	// text color
	context.fillStyle = "rgba(69, 172, 81, 1.0)";
	context.fillText( message, borderThickness, fontsize + borderThickness);
	// canvas contents will be used for a texture
	let texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;
	let spriteMaterial = new THREE.SpriteMaterial({ map: texture} );
	let sprite = new THREE.Sprite( spriteMaterial );
	sprite.scale.set(100,50,1.0);
	return sprite;
}

function setOrbitControlsLimits(controls){
    controls.minPolarAngle = 0; // radians
    controls.maxPolarAngle = Math.PI/2; // radians
    controls.minDistance = 2;
    controls.maxDistance = 450;
}

init();
