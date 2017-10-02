/* eslint-env browser */
import * as THREE from 'three';
import LeafGeometry from './LeafGeometry.js';
import Stats from 'stats.js';
import Gui from './gui.js';
import {phyllotaxisConical} from './phyllotaxis.js';
import CollectionGeometries from './geometries.js';
import CollectionMaterials from './materials.js';
import {PointLights} from './pointLights.js';
const radius = 5; //this number is used to create the geometries
const geometries = new CollectionGeometries(radius);
const materials = new CollectionMaterials;
const material = materials["standard"];
const gui = new Gui(material);
const debug = false;

//setup the scene and the camera
const scene = new THREE.Scene();
const OrbitControls = require('three-orbit-controls')(THREE);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.style.margin =0;
document.body.appendChild(renderer.domElement);

const stats = new Stats();

stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
//document.body.appendChild( stats.dom );
camera.position.z = 150;
this.controls = new OrbitControls(camera, renderer.domElement);

//palm group
var objects = [];
var leafGeometry = [];
var palm = new THREE.Group();
let n_frames = 0;
let numbTotObjects = 0;

//add lights to the scene
let ambientLight = new THREE.AmbientLight( 0x34ac0f );
scene.add( ambientLight );
renderer.setClearColor( 0x505050 );
gui.addScene(scene, ambientLight, renderer);
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
window.addEventListener('keypress', maybeGuiPressed, false);

addStats(debug);

function transformIntoLeaf(object, iter, angleInRadians){
    let PItoDeg = (Math.PI/180.0);
    // the scale ratio is a value between 0.001 and 1.
    // It is 0.0001 for the first leaves, and 1 for the last ones
    let ratio = Math.abs(iter/gui.params.foliage_start_at);
    // this is to avaoid a scaleRatio of 0, that would cause a warning while scaling
    // an object for 0
    let scaleRatio = ratio === 0 ? 0.001 : ratio;
    object.rotateZ( iter* angleInRadians);

    let yrot = (iter/gui.params.angle_open) * gui.params.foliage_start_at;
    // object.rotateY( (yrot ) * -PItoDeg );
    let y_angle = gui.params.angle_open * scaleRatio;
    object.rotateY( (gui.params.starting_angle_open + y_angle + iter * 200/numbTotObjects ) * -PItoDeg );

    // as they grow up, they become bigger
    object.scale.set(5 * scaleRatio ,1 ,1);
    object.rotateZ(-(Math.PI/2));
}

function populatePalm(foliage_geometry, trunk_geometry, selected_material) {
    let PItoDeg = (Math.PI/180.0);
    let angleInRadians = gui.params.angle * PItoDeg;
    for (var i = 0; i<numbTotObjects; i++) {
        let isALeaf = (i <= gui.params.foliage_start_at)? true : false;
        let geometry = isALeaf ? foliage_geometry : trunk_geometry;
        let object = new THREE.Mesh(geometry, selected_material);
        let coord = phyllotaxisConical(i, angleInRadians, gui.params.spread, gui.params.growth);
        object.position.set(coord.x, coord.y, coord.z);
        if (isALeaf) {
            transformIntoLeaf(object, i, angleInRadians);
        } else {
            object.rotateZ( i* angleInRadians);
            if (gui.params.trunk_regular) {
                object.rotateY( (90 + gui.params.angle_open ) * -PItoDeg );
            } else {
                object.rotateY( (90 + gui.params.angle_open + i * 100/numbTotObjects ) * -PItoDeg );
            }
        }
        objects.push(object);
        palm.add(object);
    }
    scene.add(palm);
}

function resetPalm(){
    leafGeometry = [];
    for(var index in objects){
        let object = objects[index];
			  palm.remove( object );
    }
    scene.remove(palm);
    objects = [];
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

function render(){
    stats.begin();
    n_frames++;
    let spread;
    if (gui.params.anim_spread) {
        let amp_spread = 13;
        gui.params.spread = Math.abs(Math.sin(n_frames/100) * amp_spread);
    }
    if (gui.params.anim_growth_objects) {
        numbTotObjects = Math.abs(Math.sin(n_frames/200) * gui.params.num);
    } else {
        numbTotObjects = gui.params.num;
    }
    let leaf = makeLeaf();
    leafGeometry.push(leaf);
    populatePalm(
        leafGeometry[0],
        geometries["box"],
        material);
    if (gui.params.zoetrope) {
        palm.rotateZ(gui.params.zoetrope_angle);
    }
    renderer.render(scene, camera);
    resetPalm();

    stats.end();
    requestAnimationFrame(render);
}

render();
