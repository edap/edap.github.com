import * as THREE from "three"
import Physics from "./physics.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import AI from "./AI.js"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import MobileDebug from './debug.js';
import { isMobile, updateCameraForTableVisibility, addDebugBox3D } from "./utils.js";
import Stats from 'three/addons/libs/stats.module.js'
import { updateScoreUI, showWinLose } from './ui.js';
import { createBGMaterial } from './background.js';

const textureLoader = new THREE.TextureLoader();
const glbLoader = new GLTFLoader();

const PLAYER_CAMERA_ENABLED = false;

let controls;

let tableSize, paddleSize, ballSize;
let paddle, paddleAI;
let paddleTrajectory = [];
let ball;
let STATES = {
    LOADING: 0,
    SERVING: 1,
    PLAYING: 2
}
let state = STATES.LOADING;
let input = { x: 0, y: 0 };
let inputPlane;

// Realistic ping pong scoring letiables
let lastHitter = null; // 'player' or 'ai'
let ballBouncedOnOpponentSide = false; // Track if ball bounced on opponent's side
let ballHitTable = false; // Track if ball hit table at all
let ballRadius = 0; // Global ballRadius for scoring calculations


class GameScene {
    constructor(renderer, settings) {
        this.renderer = renderer;
        this.settings = settings;
        this.scene = new THREE.Scene();
        this.bg = createBGMaterial(this.scene, 0xff00ff, 0xff0000);
        this.screenSize = { width: window.innerWidth, height: window.innerHeight };
        this.tableSize = null;
        this.inputPlane = null;
        //this.camera = new THREE.PerspectiveCamera(30, this.screenSize.width / this.screenSize.height, 0.01, 15);
        this.camera = new THREE.PerspectiveCamera(30, this.screenSize.width / this.screenSize.height, 0.01, 15);
        this.simulation = new Physics();
        this.mobileDebug = new MobileDebug;
        this.stats = new Stats();
        this.controls = null;
        this.ai = null;
        this.score = { player: 0, ai: 0 };
    }


    init() {
        // if (window.PingPong && this.mobileDebug) {
        //     this.mobileDebug.logGameState('INITIALIZING', 'Starting game scene setup');
        // }

        //create scene
        //screenSize = {width:window.innerWidth, height: window.innerHeight};
        // TODO
        //window.screenSize = screenSize; // Make accessible for resize handler

        //initialize camera
        this.scene.add(this.camera);
        this.camera.position.set(0, 1, 3);
        //this.camera.position.set(0, this.settings.height / 2, this.settings.depth / 2);
        this.camera.lookAt(this.scene.position);
        this.stats.showPanel(0);

        if (this.settings.debug) {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            document.body.appendChild(this.stats.dom);
        }

        //initialize audio
        //if (this.mobileDebug) this.mobileDebug.logGameState('AUDIO_INIT', 'Initializing audio system');

        this.simulation.init(this.settings)


        //initialize world
        //this.loadLight();
        this.setupLighting();
        this.loadModels();
        this.initInput();
        updateScoreUI(this.score);

        //controls = new THREE.OrbitControls( camera, this.renderer.domElement );
    }

    setupLighting() {
        // Minimal, clean lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);
        const dir = new THREE.DirectionalLight(0xffffff, 1.7);
        dir.position.set(5, 10, 7);
        this.scene.add(dir);

        if(!isMobile()){
            let spotLight = new THREE.SpotLight(0xffffff, 13.8);
            spotLight.position.set(0, 1.0, 2.6);
            spotLight.target.position.set(0, 0, 0.0);
            spotLight.target.updateMatrixWorld();
            this.scene.add(spotLight);
    
            //const spotLightHelper = new THREE.SpotLightHelper( spotLight );
            //this.scene.add( spotLightHelper );
        }
    }

    loadModels() {

        let me = this;

        const onGlbTableLoad = (glb) => {
            console.log(glb.scene.children)
            const table = glb.scene.getObjectByName("table");
            const net = glb.scene.getObjectByName("net");
            paddle = glb.scene.getObjectByName("paddle");


            // Compute the model's bounding box to get original dimensions
            const box = new THREE.Box3().setFromObject(table);
            const modelSize = {
                width: box.max.x - box.min.x,
                depth: box.max.z - box.min.z,
                height: box.max.y - box.min.y
            };

            // Scale the table, net and paddle based on desired width
            const scale = me.settings.table.width / modelSize.width;
            table.scale.set(scale, scale, scale);
            net.scale.set(scale, scale, scale);
            paddle.scale.set(scale, scale, scale);

            this.tableSize = {
                width: modelSize.width * scale,
                depth: modelSize.depth * scale,
                height: modelSize.height * scale,
                scale: scale
            };

            const collisionBoxTable = new THREE.Box3().setFromObject(table);
            console.log(collisionBoxTable)

            if (this.settings.debug) {
                addDebugBox3D(collisionBoxTable, this.scene);
            }
            me.simulation.addBox(collisionBoxTable);



            // Optional wall mode
            const wallMode = this.settings.wallMode;
            if (wallMode) {
                const netBox = new THREE.Box3().setFromCenterAndSize(
                    new THREE.Vector3(0, this.tableSize.height, 0),
                    new THREE.Vector3(this.tableSize.width, this.tableSize.height * 4, this.tableSize.depth * 0.02)
                );
                me.simulation.addBox(netBox);

                const netHitCube = new THREE.Mesh(
                    new THREE.BoxGeometry(
                        netBox.max.x - netBox.min.x,
                        netBox.max.y - netBox.min.y,
                        netBox.max.z - netBox.min.z
                    ),
                    new THREE.MeshBasicMaterial({ color: 0x000000 })
                );
                netHitCube.position.y = this.tableSize.height;
                netHitCube.visible = false;
                this.scene.add(netHitCube);
            }

            // Input plane setup
            this.inputPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), this.tableSize.height * 0.95);

            // Set up camera position to ensure table is fully visible
            updateCameraForTableVisibility(this.tableSize, this.camera, this.mobileDebug, this.screenSize);

            // Finalize table and add to scene
            table.matrixAutoUpdate = false;
            table.updateMatrix();
            this.scene.add(table);
            this.scene.add(net);

            // Paddle
            paddle.position.set(0, this.tableSize.height, this.tableSize.depth / 2);
            this.scene.add(paddle);

            paddleAI = paddle.clone();
            paddleAI.position.set(0, this.tableSize.height, -this.tableSize.depth / 2);
            this.scene.add(paddleAI);

            const paddleBox = new THREE.Box3().setFromObject(paddle);
            paddleSize = {
                width: paddleBox.max.x - paddleBox.min.x,
                depth: paddleBox.max.z - paddleBox.min.z,
                height: paddleBox.max.y - paddleBox.min.y
            };

            ballRadius = paddleSize.width * 0.13; // Set global ballRadius
            let ballGeometry = new THREE.SphereGeometry(ballRadius, 16, 16);
            let ballMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, ambient: 0xcccccc });
            ball = new THREE.Mesh(ballGeometry, ballMaterial);
            ball.position.set(0, this.tableSize.height * 2, this.tableSize.depth * 0.25);
            this.scene.add(ball);
            me.simulation.setBall(ball, ballRadius);

            this.ai = new AI(me.simulation, this.tableSize, paddleAI, paddleSize, ball, ballRadius);

            // Set AI difficulty - can be changed to 'easy' or 'hard'
            // me.ai.setDifficulty('normal'); // TEMPORARILY DISABLED until AI.js is updated

            state = STATES.SERVING;
            // Update touchpad message for initial state
            me.updateTouchpadMessage();
        }

        // TODO, renable logging
        //if (this.mobileDebug) this.mobileDebug.logLoadingProgress('Table Model', 0, 2);

        // Update loading message
        if (document.getElementById('loadingMessage')) {
            document.getElementById('loadingMessage').innerHTML = 'Loading ' + modelName + '...';
        }
        glbLoader.load(this.settings.table.model, onGlbTableLoad);
    }

    initInput() {

        let me = this;
        function inputHandler(ev) {
            if (ev.targetTouches && ev.targetTouches.length > 1) {
                // Only serve if in SERVING state (prevent multiple balls)
                if (state === STATES.SERVING) {
                    me.serve();
                }
                return;
            }
            let x = ev.targetTouches ? ev.targetTouches[0].clientX : ev.clientX;
            let y = ev.targetTouches ? ev.targetTouches[0].clientY : ev.clientY;
            me.processInput(x, y);
        }

        // Only serve if in SERVING state (prevent multiple balls)
        this.renderer.domElement.addEventListener("mousedown", function () {
            if (state === STATES.SERVING) {
                try {
                    me.serve();
                } catch (error) {
                    console.warn('Serve error:', error);
                    // Fallback serve
                    state = STATES.PLAYING;
                    ball.position.set(paddle.position.x, paddle.position.y + paddleSize.height, paddle.position.z);
                    let dir = new THREE.Vector3(0, -0.5, -1);
                    me.simulation.hitBall(dir, 0.02);
                    if (me.updateTouchpadMessage) me.updateTouchpadMessage();
                }
            }
        });
        this.renderer.domElement.addEventListener("mousemove", inputHandler);
        this.renderer.domElement.addEventListener("touchstart", function (ev) {
            console.log('MOBILE TOUCH: touchstart event fired, state:', state);

            // Handle serving on tap in touchpad area
            if (state === STATES.SERVING) {
                if (isMobile()) {
                    let x = ev.targetTouches ? ev.targetTouches[0].clientX : ev.clientX;
                    let y = ev.targetTouches ? ev.targetTouches[0].clientY : ev.clientY;
                    let touchpadZone = {
                        left: screenSize.width * 0.1,
                        right: screenSize.width * 0.9,
                        top: screenSize.height * 0.67,
                        bottom: screenSize.height * 0.95
                    };
                    let isInTouchpad = (x >= touchpadZone.left && x <= touchpadZone.right &&
                        y >= touchpadZone.top && y <= touchpadZone.bottom);

                    console.log('MOBILE TOUCH: touch at', x, y, 'in touchpad:', isInTouchpad);

                    if (isInTouchpad) {
                        try {
                            console.log('MOBILE TOUCH: attempting to serve');
                            me.serve();
                        } catch (error) {
                            console.warn('Touch serve error:', error);
                            // Fallback serve
                            state = STATES.PLAYING;
                            ball.position.set(paddle.position.x, paddle.position.y + paddleSize.height, paddle.position.z);
                            let dir = new THREE.Vector3(0, -0.5, -1);
                            me.simulation.hitBall(dir, 0.02);
                            if (me.updateTouchpadMessage) me.updateTouchpadMessage();
                        }
                    }
                }
            }
            inputHandler(ev);
        });
        this.renderer.domElement.addEventListener("touchmove", inputHandler);

        // Add visual touchpad indicator for mobile
        this.createTouchpadIndicator();

        // Fallback: Force remove any blocking overlays after 5 seconds
        setTimeout(function () {
            let audioOverlay = document.getElementById('audio-unlock-overlay');
            if (audioOverlay) {
                console.log('MOBILE FIX: Force removing stuck audio overlay');
                audioOverlay.remove();
            }
        }, 5000);
    }

    createTouchpadIndicator() {
        if (isMobile()) {
            // Create OBVIOUS light pink touchpad overlay
            let touchpadDiv = document.createElement('div');
            touchpadDiv.id = 'touchpad-indicator';
            touchpadDiv.style.position = 'absolute';
            touchpadDiv.style.left = '10%';
            touchpadDiv.style.right = '10%';
            touchpadDiv.style.top = '67%';
            touchpadDiv.style.bottom = '5%';
            touchpadDiv.style.border = '3px solid rgba(255, 182, 193, 0.6)'; // Light pink border
            touchpadDiv.style.borderRadius = '15px';
            touchpadDiv.style.backgroundColor = 'rgba(255, 182, 193, 0.15)'; // Light pink transparent
            touchpadDiv.style.pointerEvents = 'none'; // Don't interfere with touch events
            touchpadDiv.style.zIndex = '1000';
            touchpadDiv.style.transition = 'all 0.3s ease';
            touchpadDiv.style.boxShadow = 'inset 0 0 20px rgba(255, 182, 193, 0.3)';

            // Add launch message (shows when waiting to serve)
            let launchMessage = document.createElement('div');
            launchMessage.id = 'launch-message';
            launchMessage.innerHTML = '🏓 TAP HERE TO PING!';
            launchMessage.style.position = 'absolute';
            launchMessage.style.top = '50%';
            launchMessage.style.left = '50%';
            launchMessage.style.transform = 'translate(-50%, -50%)';
            launchMessage.style.color = 'rgba(255, 182, 193, 0.9)';
            launchMessage.style.fontSize = '24px';
            launchMessage.style.fontFamily = 'Arial, sans-serif';
            launchMessage.style.fontWeight = 'bold';
            launchMessage.style.textAlign = 'center';
            launchMessage.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
            launchMessage.style.animation = 'pulse 1.5s ease-in-out infinite';
            touchpadDiv.appendChild(launchMessage);

            // Add directional hint
            let hint = document.createElement('div');
            hint.innerHTML = '↑ Move up to approach net • ← → Move left/right';
            hint.style.position = 'absolute';
            hint.style.bottom = '15px';
            hint.style.left = '50%';
            hint.style.transform = 'translateX(-50%)';
            hint.style.color = 'rgba(255, 182, 193, 0.7)';
            hint.style.fontSize = '12px';
            hint.style.fontFamily = 'Arial, sans-serif';
            hint.style.textAlign = 'center';
            hint.style.lineHeight = '1.3';
            touchpadDiv.appendChild(hint);

            document.body.appendChild(touchpadDiv);

            // Add CSS animation for pulse effect
            let style = document.createElement('style');
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
                }
            `;
            document.head.appendChild(style);

            // Store reference for later updates
            this.touchpadDiv = touchpadDiv;
            this.launchMessage = launchMessage;

            if (this.mobileDebug) {
                this.mobileDebug.log('🎮 Enhanced pink touchpad indicator created');
            }
        }
    }

    updateTouchpadMessage() {
        if (isMobile() && this.launchMessage) {
            if (state === STATES.SERVING) {
                this.launchMessage.style.display = 'block';
                this.launchMessage.innerHTML = '🏓 TAP HERE TO PING!';
            } else if (state === STATES.PLAYING) {
                this.launchMessage.style.display = 'block';
                this.launchMessage.innerHTML = '🎮 PLAYING!';
                this.launchMessage.style.animation = 'none'; // Stop pulsing during play
            } else {
                this.launchMessage.style.display = 'none';
            }
        }
    }





    createModelDebugOverlay(modelName) {
        // Create a simple debug overlay showing current table model
        let debugDiv = document.createElement('div');
        debugDiv.id = 'model-debug-overlay';
        debugDiv.style.position = 'absolute';
        debugDiv.style.top = '10px';
        debugDiv.style.left = '10px';
        debugDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        debugDiv.style.color = 'white';
        debugDiv.style.padding = '8px 12px';
        debugDiv.style.borderRadius = '5px';
        debugDiv.style.fontFamily = 'Arial, sans-serif';
        debugDiv.style.fontSize = '12px';
        debugDiv.style.zIndex = '10000';
        debugDiv.style.pointerEvents = 'none';
        debugDiv.innerHTML = '🏓 Table: ' + modelName;

        // Remove any existing debug overlay
        let existing = document.getElementById('model-debug-overlay');
        if (existing) {
            existing.remove();
        }

        document.body.appendChild(debugDiv);

        // Auto-hide after 5 seconds
        setTimeout(function () {
            if (debugDiv.parentNode) {
                debugDiv.style.opacity = '0.3';
            }
        }, 5000);
    }

    processInput(x, y) {
        if (isMobile()) {
            // VIRTUAL TOUCHPAD SYSTEM for mobile
            // Define touchpad area (red rectangle from user's image)
            let touchpadZone = {
                left: screenSize.width * 0.1,    // 10% from left edge
                right: screenSize.width * 0.9,   // 90% from left edge
                top: screenSize.height * 0.67,   // 67% from top (20% shorter height)
                bottom: screenSize.height * 0.95 // 95% from top (near bottom)
            };

            // Check if touch is in the virtual touchpad area
            let isInTouchpad = (x >= touchpadZone.left && x <= touchpadZone.right &&
                y >= touchpadZone.top && y <= touchpadZone.bottom);

            // Check if touch is within the defined touchpad area

            if (isInTouchpad) {
                // Map touchpad coordinates to game coordinates
                // Convert touchpad local coordinates to normalized game coordinates
                let touchpadX = (x - touchpadZone.left) / (touchpadZone.right - touchpadZone.left);  // 0-1 across width
                let touchpadY = (y - touchpadZone.top) / (touchpadZone.bottom - touchpadZone.top);   // 0-1 across height

                // Map touchpad to screen coordinates for paddle control
                // X: full left-right movement
                // Y: forward/back movement (up in touchpad = toward net)
                input.x = touchpadX * screenSize.width;
                input.y = touchpadY * screenSize.height * 0.4 + screenSize.height * 0.3; // Map to upper part of screen
            } else {
                // Touch outside touchpad - ignore and maintain last known position
                return;
            }
        } else {
            // DESKTOP: Direct input (unchanged)
            input.x = x;
            input.y = y;
        }
    }

    serve() {
        state = STATES.PLAYING;
        ball.position.set(paddle.position.x, paddle.position.y + paddleSize.height, paddle.position.z);

        let dir = new THREE.Vector3(0, -0.5, -1);
        this.simulation.hitBall(dir, 0.02);

        // Reset scoring tracking for new rally
        lastHitter = 'player'; // Player served
        ballBouncedOnOpponentSide = false;
        ballHitTable = false;

        // Update touchpad message for new state
        this.updateTouchpadMessage();

    }

    cameraFollowPlayer(px,py) {
        // Raw input converted to normalized coordinates

        //set this.camera position - AGGRESSIVE motion sickness prevention for mobile

        // Mobile vs desktop this.camera handling

        if (isMobile()) {
            // MOBILE: Optimized this.camera for mobile touchpad control
            let smoothing = 0.06;    // More responsive for better control
            let deadzone = 0.1;      // Standard deadzone
            let movementScale = 0.15; // Reduced movement for stability

            if (Math.abs(px) > deadzone) {
                let targetCx = this.tableSize.width * movementScale * px;
                this.camera.position.x += (targetCx - this.camera.position.x) * smoothing;
            }

            // MOBILE: Fixed this.camera position for optimal mobile viewing
            // Position this.camera for clear view of table with touchpad below
            let targetCy = this.tableSize.height * 1.6; // Proper height for good table view
            let targetCz = this.tableSize.depth * 1.8;  // Further back for full table visibility


            this.camera.position.y += (targetCy - this.camera.position.y) * 0.12;
            this.camera.position.z += (targetCz - this.camera.position.z) * 0.12;

        } else {
            // DESKTOP: Normal responsive this.camera
            let smoothing = 0.05;
            let deadzone = 0.1;
            let movementScale = 0.2;

            if (Math.abs(px) > deadzone) {
                let targetCx = this.tableSize.width * movementScale * px;
                this.camera.position.x += (targetCx - this.camera.position.x) * smoothing;
            }

            let targetCy = this.tableSize.height * 1.4;
            let targetCz = this.tableSize.depth * 1.3;

            this.camera.position.y += (targetCy - this.camera.position.y) * 0.1;
            this.camera.position.z += (targetCz - this.camera.position.z) * 0.1;
        }

        // Both mobile and desktop use same smooth lookAt
        // Halfway between center and player edge center
        this.camera.lookAt(new THREE.Vector3(0, this.tableSize.height, this.tableSize.depth * 0.25));

        // Enhanced mobile debugging
        if (isMobile() && this.mobileDebug && this.debugFrameCount % 60 === 0) {
            this.mobileDebug.log('📹 Mobile this.Camera: pos(' +
                this.camera.position.x.toFixed(2) + ',' +
                this.camera.position.y.toFixed(2) + ',' +
                this.camera.position.z.toFixed(2) + ') input(' +
                px.toFixed(2) + ',' + py.toFixed(2) + ')');
        }
        this.debugFrameCount = (this.debugFrameCount || 0) + 1;

    }

    update() {
        if (state === STATES.LOADING) {
            return;
        }

        if (state === STATES.PLAYING) {
            this.ai.play();
            this.simulation.simulate();
        }

        let px = (input.x / this.screenSize.width) * 2 - 1;
        let py = - (input.y / this.screenSize.height) * 2 + 1;
        if (PLAYER_CAMERA_ENABLED){
            this.cameraFollowPlayer(px,py);
        }


        //this.camera.rotation.y = Math.PI * -0.05 * px;

        //Project input to table plane
        let maxpy = Math.min(0, py);
        let vector = new THREE.Vector3(px, maxpy, 0.5);
        // Convert NDC to world coordinates
        vector.unproject(this.camera);
        let ray = new THREE.Ray(this.camera.position, vector.sub(this.camera.position).normalize());
        let intersect = new THREE.Vector3(0, 0, 0);
        ray.intersectPlane(this.inputPlane, intersect);

        if (!intersect) {
            intersect = paddle.position.clone();
        }

        // PADDLE CONSTRAINTS: Expanded movement area for better gameplay
        // Allow paddle to move beyond table bounds for more natural play
        let minZ = this.tableSize.depth * 0.10;  // Allow closer to net for aggressive play
        let maxZ = this.tableSize.depth * 0.60;  // Allow much closer to observer (+15% freedom)
        let maxX = this.tableSize.width * 0.50;  // Allow beyond table edges (+15% freedom)

        intersect.z = Math.max(minZ, Math.min(maxZ, intersect.z));
        intersect.x = Math.max(-maxX, Math.min(maxX, intersect.x));

        //set paddle position
        paddle.position.x = intersect.x;
        paddle.position.z = intersect.z;
        paddle.position.y = this.tableSize.height;



        if (state == STATES.SERVING) {
            ball.position.set(paddle.position.x, paddle.position.y + paddleSize.height, paddle.position.z);
        }
        else {
            this.checkBallHit();

            // Check for ball out of bounds and scoring
            this.checkBallOutOfBounds();
        }

        //set paddle rotation
        let dx = Math.min(1, Math.abs(paddle.position.x / (this.tableSize.width * 0.6)));
        let dxAI = Math.min(1, Math.abs(paddleAI.position.x / (this.tableSize.width * 0.6)));


        paddle.rotation.z = Math.PI * 0.5 * dx * (paddle.position.x > 0 ? -1.0 : 1.0);
        paddle.rotation.x = Math.PI * 0.2 * dx;
        paddle.rotation.y = Math.PI * 0.2 * dx * (paddle.position.x > 0 ? 1.0 : -1.0);

        paddleAI.rotation.z = Math.PI * 0.5 * dxAI * (paddleAI.position.x > 0 ? 1.0 : -1.0);
        paddleAI.rotation.x = -Math.PI * 0.2 * dxAI;
        paddleAI.rotation.y = Math.PI * 0.2 * dxAI * (paddleAI.position.x > 0 ? -1.0 : 1.0);
        paddleAI.rotation.y += Math.PI;

    }

    checkBallOutOfBounds() {
        let ballOutOfBounds = false;
        let scoreForPlayer = false;
        let scoreForAI = false;
        let reasonForPoint = '';

        // Check if ball bounced on table (realistic bounce detection)
        let ballNearTable = Math.abs(ball.position.y - this.tableSize.height) < ballRadius * 2 &&
            Math.abs(ball.position.x) < this.tableSize.width * 0.5 &&
            Math.abs(ball.position.z) < this.tableSize.depth * 0.5;

        if (ballNearTable && !ballHitTable) {
            ballHitTable = true;
            // Determine which side of table ball bounced on
            if (ball.position.z > 0) {
                // Ball bounced on player's side
                if (lastHitter === 'ai') {
                    ballBouncedOnOpponentSide = true;
                    if (this.mobileDebug) {
                        this.mobileDebug.log('🏓 Ball bounced on player side after AI hit');
                    }
                }
            } else {
                // Ball bounced on AI's side
                if (lastHitter === 'player') {
                    ballBouncedOnOpponentSide = true;
                    if (this.mobileDebug) {
                        this.mobileDebug.log('🏓 Ball bounced on AI side after player hit');
                    }
                }
            }
        }

        // Ball too far left/right (out of bounds)
        if (Math.abs(ball.position.x) > this.tableSize.width * 0.6) {
            ballOutOfBounds = true;
            reasonForPoint = 'Ball went off side of table';
        }

        // Ball too low (fell below table)
        if (ball.position.y < this.tableSize.height * 0.3) {
            ballOutOfBounds = true;
            reasonForPoint = 'Ball fell below table';
        }

        // Ball too far on player's side (went past player)
        if (ball.position.z > this.tableSize.depth * 0.7) {
            ballOutOfBounds = true;
            reasonForPoint = 'Ball went past player';
        }

        // Ball too far on AI's side (went past AI)
        if (ball.position.z < -this.tableSize.depth * 0.7) {
            ballOutOfBounds = true;
            reasonForPoint = 'Ball went past AI';
        }

        if (ballOutOfBounds) {
            // REALISTIC PING PONG SCORING RULES
            if (lastHitter === 'player') {
                if (!ballBouncedOnOpponentSide) {
                    // Player hit but ball didn't bounce on AI's side = AI gets point
                    scoreForAI = true;
                    reasonForPoint += ' (Player hit, no bounce on AI side)';
                } else {
                    // Player hit, ball bounced on AI's side, then went out = Player gets point
                    scoreForPlayer = true;
                    reasonForPoint += ' (Ball bounced on AI side after player hit)';
                }
            } else if (lastHitter === 'ai') {
                if (!ballBouncedOnOpponentSide) {
                    // AI hit but ball didn't bounce on player's side = Player gets point
                    scoreForPlayer = true;
                    reasonForPoint += ' (AI hit, no bounce on player side)';
                } else {
                    // AI hit, ball bounced on player's side, then went out = AI gets point
                    scoreForAI = true;
                    reasonForPoint += ' (Ball bounced on player side after AI hit)';
                }
            } else {
                // Fallback - shouldn't happen but just in case
                if (ball.position.z > 0) {
                    scoreForAI = true; // Ball on player side, AI gets point
                } else {
                    scoreForPlayer = true; // Ball on AI side, player gets point
                }
                reasonForPoint += ' (Fallback rule)';
            }

            if (scoreForPlayer) {
                this.score.player++;
                if (this.mobileDebug) {
                    this.mobileDebug.log('🏆 PLAYER SCORES! Reason: ' + reasonForPoint + ' | Score: ' + this.score.player + '-' + this.score.ai);
                }
            } else if (scoreForAI) {
                this.score.ai++;
                if (this.mobileDebug) {
                    this.mobileDebug.log('🤖 AI SCORES! Reason: ' + reasonForPoint + ' | Score: ' + this.score.player + '-' + this.score.ai);
                }
            }

            // Update scoreboard display
            //this.updateScoreboard();
            updateScoreUI(this.score);

            // Reset for next serve
            state = STATES.SERVING;
            this.updateTouchpadMessage();

            // Reset ball position
            ball.position.set(0, this.tableSize.height * 2, this.tableSize.depth * 0.25);

            if (this.mobileDebug) {
                this.mobileDebug.log('🔄 Round ended, ready for new serve');
            }
        }
    }

    checkBallHit() {
        let hitting = false;
        let hit = false;
        //check if paddle and ball are close
        if (this.simulation.getLinearVelocity().z > 0 && paddle.position.z > ball.position.z) {
            //store trayectory
            let trayectory = {
                time: Date.now(),
                x: paddle.position.x,
                y: paddle.position.y,
                z: paddle.position.z
            }
            paddleTrajectory.push(trayectory);

            //check hit distances
            let zDistance = paddle.position.z - ball.position.z;
            let xDistance = Math.abs(paddle.position.x - ball.position.x);
            let yDistance = paddle.position.y - ball.position.y;
            hit = zDistance < this.tableSize.depth * 0.03 && xDistance < paddleSize.width && Math.abs(yDistance) < paddleSize.height * 0.75;
            hitting = zDistance < this.tableSize.depth * 0.2 && xDistance < paddleSize.width;
        }

        //target paddle y position
        let targetY = this.tableSize.height;
        if (hitting) {
            targetY = ball.position.y;
        }
        let diffY = paddle.position.y - targetY;
        paddle.position.y += Math.min(Math.abs(diffY), paddleSize.height * 0.1) * (diffY ? -1 : 1);

        if (hit) {
            let trayectory = this.calculatePaddleTrajectory();
            trayectory.z = Math.min(trayectory.z, 0);

            let dir = new THREE.Vector3(0, 0, 0);
            //fixed z
            dir.z = -1.0;
            //trayector dependant x
            let tx = trayectory.x / (this.tableSize.width * 0.1);
            dir.x = 0.6 * Math.min(Math.abs(tx), 1.0) * (tx > 0 ? 1 : -1);
            //trayectory dependant force and y
            let tz = trayectory.z / (this.tableSize.depth * 0.25);
            tz = Math.min(Math.abs(tz), 1);
            let force = 0.02 + tz * 0.01;

            dir.y = 0.4;
            if (ball.position.y < this.tableSize.height) {
                dir.y += 0.1;
            }
            else {
                force *= 1.1;
            }

            dir.y -= force * 2;
            if (paddle.position.z < this.tableSize.depth / 2) {
                dir.y -= 0.1;
            }


            this.simulation.hitBall(dir, force);
            paddleTrajectory.length = 0; //clear

            // Track that player hit the ball for realistic scoring
            lastHitter = 'player';
            ballBouncedOnOpponentSide = false; // Reset bounce tracking
            ballHitTable = false; // Reset table hit tracking

            if (this.mobileDebug) {
                this.mobileDebug.log('🏓 PLAYER HIT BALL - lastHitter set to player');
            }

        }
    }

    calculatePaddleTrajectory() {
        let now = Date.now();
        let trayectory = new THREE.Vector3(0, 0, 0);
        let prevT = null;
        for (let i = 0; i < paddleTrajectory.length; ++i) {
            let t = paddleTrajectory[i];
            if (now - t.time > 200) {
                continue; //we only check 200ms trayectory
            }
            if (!prevT) {
                prevT = t;
                continue;
            }
            trayectory.set(trayectory.x + t.x - prevT.x,
                trayectory.y + t.y - prevT.y,
                trayectory.z + t.z - prevT.z);
            prevT = t;
        }
        return trayectory;

    }

    resize(width, height) {
        this.camera.aspect = width / height;

        // Update screen size
        this.screenSize.width = width;
        this.screenSize.height = height;

        // Only recalculate camera position if table is loaded
        if (this.tableSize) {
            updateCameraForTableVisibility(this.tableSize, this.camera, this.mobileDebug, this.screenSize);
        }

        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.bg.uniforms.ratio.value = width / height;
    }


    render() {
        if (this.settings.debug) {
            // controls useful to debug sometime
            //this.controls.update();
            this.stats.begin();
        }
        this.update();
        this.renderer.render(this.scene, this.camera);
        if (this.settings.debug) { this.stats.end() };
    }
}

export default GameScene;