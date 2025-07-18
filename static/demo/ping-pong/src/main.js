import * as THREE from "three";
import GamePanel from "./game_panel.js"
import { createSettings } from "./utils.js";
import { loadBallSounds, loadRandomSounds, loadLongPressSound, loadModel, loadCategoriesMapping } from "./loaders.js";

let renderer;
let gamePanel;

const init = (settings, categories, longPressSound, randomSounds, ballSounds, glbModel) => {
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

    gamePanel = new GamePanel();
    gamePanel.init(categories, longPressSound, randomSounds, ballSounds, renderer, settings, glbModel)

    // Handle window resize
    window.addEventListener('resize', handleResize, false);
}

const handleResize = () => { 
    let width = window.innerWidth;
    let height = window.innerHeight;
    gamePanel.gameScene.resize(width, height)
}

const render = () => {
    gamePanel.gameScene.render();
    requestAnimationFrame(render);
}

async function loadGame() {
    const loadingEl = document.getElementById('loading');
    if (!loadingEl) {
        console.error("Error: '#loading' element not found in the DOM.");
        return; // Exit if the element isn't found
    }
    loadingEl.style.display = 'block';

    try {
        let settings = createSettings();
        // Await all initial asset loads
        const [categories,longPressSound, randomSounds, ballSounds, glbModel] = await Promise.all([
            loadCategoriesMapping(),
            loadLongPressSound(),
            loadRandomSounds(),
            loadBallSounds(),
            loadModel(settings.table.model)
        ]);

        loadingEl.style.display = 'none';
        init(settings, categories, longPressSound, randomSounds, ballSounds, glbModel);
        render();
    } catch (error) {
        console.error('❌ Error loading game assets:', error);
        loadingEl.innerText = 'Failed to load game. Check console for details.';
    }
}

// Attach loadGame to the DOMContentLoaded event
document.addEventListener('DOMContentLoaded', loadGame);