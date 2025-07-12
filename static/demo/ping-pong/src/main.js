import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import GameScene from "./game_scene.js"

let renderer;
let gameScene;



const createSettings = () => {

    //size in meters
    let width = 10;
    let depth = 20;
    let height = 5;
    let tableWidth = 1.5;

    let quality = 0;

    let settings = {
        debug: false,
        wallMode: false,
        width: width,
        height: height,
        depth: depth,
        table: {
            model: "models/table.glb",
            width: tableWidth,
            // color: 0x2b476e,
            // texture: "images/table.jpg"
        },

        audio: {
            ball: ["audio/ball1.ogg", "audio/ball2.ogg"]
            // Random Mode sounds loaded automatically by AudioManager
        },

        mobile: {
            enabled: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            touchSensitivity: 0.8
        }
    };

    return settings;
}

const init = () => {
    let settings = createSettings();

    let canvas = document.createElement("canvas");
    canvas.screencanvas = true; //for cocoonjs
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Mobile-optimized renderer settings
    let rendererConfig = {
        antialias: !settings.mobile.enabled, // Disable antialiasing on mobile for performance
        canvas: canvas,
        powerPreference: "high-performance"
    };

    renderer = new THREE.WebGLRenderer(rendererConfig);
    renderer.setClearColor(0x000000);
    renderer.setSize(canvas.width, canvas.height);

    // Mobile-specific optimizations  
    if (settings.mobile.enabled) {
        // Check if setPixelRatio exists (Three.js r60 doesn't have it)
        if (renderer.setPixelRatio) {
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
    }

    document.getElementById('container').appendChild(renderer.domElement);

    gameScene = new GameScene(renderer, settings);
    gameScene.init();

    // Handle window resize
    window.addEventListener('resize', handleResize, false);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            gameScene.mobileDebug.init();
        });
    } else {
        gameScene.mobileDebug.init();
    }
}

const handleResize = () => { 
    let width = window.innerWidth;
    let height = window.innerHeight;
    gameScene.resize(width, height)
}

const render = () => {
    gameScene.render();
    requestAnimationFrame(render);
}

init();
render();
