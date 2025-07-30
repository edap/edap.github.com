import * as THREE from "three";
import GamePanel from "./game_panel.js"
import { createSettings } from "./settings.js";
import { loadBallSounds, loadRandomSounds, loadLongPressSound, loadModel, loadCategoriesMapping } from "./utils/loaders.js";

let renderer;
let gamePanel;



const init = (settings, categories, longPressSound, randomSounds, ballSounds, glbModel) => {
    let canvas = document.createElement("canvas");
    canvas.screencanvas = true;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let rendererConfig = {
        antialias: !settings.mobile.enabled,
        canvas: canvas,
        powerPreference: "high-performance"
    };

    console.log(rendererConfig);

    renderer = new THREE.WebGLRenderer(rendererConfig);
    renderer.setClearColor(0x000000);
    renderer.setSize(canvas.width, canvas.height);

    if (settings.mobile.enabled) {
        // Check if setPixelRatio exists (Three.js r60 doesn't have it)
        if (renderer.setPixelRatio) {
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
    }

    document.getElementById('container').appendChild(renderer.domElement);

    gamePanel = new GamePanel();
    gamePanel.init(categories, longPressSound, randomSounds, ballSounds, renderer, settings, glbModel);

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
    const loadingTextEl = document.getElementById('loading-text');
    const topBarContainer = document.getElementById('top-bar-container');
    const audioPanelButton = document.getElementById('audio-panel-toggle-btn');

    // loadingEl.style.display = 'flex';
    // loadingTextEl.textContent = 'Loading';
    // loadingTextEl.style.color = '#fff';

    try {
        let settings = createSettings();
        const [categories, longPressSound, randomSounds, ballSounds, glbModel] = await Promise.all([
            loadCategoriesMapping(),
            loadLongPressSound(),
            loadRandomSounds(),
            loadBallSounds(),
            loadModel(settings.table.model)
        ]);

        loadingEl.style.display = 'none';
        topBarContainer.style.display = 'flex';
        audioPanelButton.style.display = 'block'

        init(settings, categories, longPressSound, randomSounds, ballSounds, glbModel);
        render();
    } catch (error) {
        console.error('❌ Error loading game assets:', error);
        if (loadingTextEl) {
            loadingTextEl.textContent = 'Failed to load game. Check console for details.';
            loadingTextEl.style.color = 'red';
        }
        loadingEl.style.display = 'flex';
    }
}

document.addEventListener('DOMContentLoaded', loadGame);