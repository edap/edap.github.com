import * as THREE from "three"
import {Physics, calculatePaddleTrajectory }from "./physics.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import AI from "./AI.js"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import MobileDebug from './debug.js';
import { isMobile, updateCameraForTableVisibility, addDebugBox3D } from "./utils.js";
import Stats from 'three/addons/libs/stats.module.js'
import { updateScoreUI } from './ui.js';
import { createBGMaterial } from './background.js';

const glbLoader = new GLTFLoader();


let controls;
let paddleSize;

let paddleTrajectory = [];
let ball;
let STATES = {
    LOADING: 0,
    SERVING: 1,
    PLAYING: 2
}
let state = STATES.LOADING;


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
        this.input = { x: 0, y: 0 };
        this.camera = new THREE.PerspectiveCamera(30, this.screenSize.width / this.screenSize.height, 0.01, 15);
        this.simulation = new Physics();
        this.mobileDebug = new MobileDebug;
        this.stats = new Stats();
        this.controls = null;
        this.ai = null;
        this.score = { player: 0, ai: 0 };
        this.paddle;
        this.paddleAI;
    }

    init(randomSounds, ballSounds, glbModel) {
        //console.error(glbModel)
        this.scene.add(this.camera);
        this.camera.position.set(0, 1, 3);
        this.camera.lookAt(this.scene.position);
        this.stats.showPanel(0);

        if (this.settings.debug) {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            document.body.appendChild(this.stats.dom);
        }
        this.simulation.init(this.settings,randomSounds, ballSounds)
        this.setupLighting();
        // TODO, we are loading the model two times, one here, one in main.js
        // refactor the code so that we remove loadModels and we use only "parseGlb(model)"
        //this.parseGlb(glbModel)
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

    parseGlb(glb){
    }

    loadModels() {
        let me = this;

        const onGlbTableLoad = (glb) => {
            //console.error(glb)
            const table = glb.scene.getObjectByName("table");
            const net = glb.scene.getObjectByName("net");
            this.paddle = glb.scene.getObjectByName("paddle");

            // console.error(table)
            // console.error(net)
            // console.error(this.paddle)

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
            this.paddle.scale.set(scale, scale, scale);

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
            this.paddle.position.set(0, this.tableSize.height, this.tableSize.depth / 2);
            this.scene.add(this.paddle);

            this.paddleAI = this.paddle.clone();
            this.paddleAI.position.set(0, this.tableSize.height, -this.tableSize.depth / 2);
            this.scene.add(this.paddleAI);

            const paddleBox = new THREE.Box3().setFromObject(this.paddle);
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

            this.ai = new AI(me.simulation, this.tableSize,this.paddleAI, paddleSize, ball, ballRadius);

            // Set AI difficulty - can be changed to 'easy' or 'hard'
            // me.ai.setDifficulty('normal'); // TEMPORARILY DISABLED until AI.js is updated

            state = STATES.SERVING;
            // Update touchpad message for initial state
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
        let me = this; // Capture 'this' context
    
        // Unified input handler for mousemove and touchmove
        function inputHandler(ev) {
            // Prevent default touch behavior (e.g., scrolling, zooming)
            if (ev.type.startsWith('touch')) {
                ev.preventDefault();
            }
    
            // Handle multi-touch: only serve if two fingers are down (or more)
            if (ev.targetTouches && ev.targetTouches.length > 1) {
                if (state === STATES.SERVING) {
                    me.serve(); // Two fingers = serve
                }
                return; // Ignore multi-touch for paddle movement
            }
    
            // Get single touch/mouse coordinates
            let x = ev.targetTouches ? ev.targetTouches[0].clientX : ev.clientX;
            let y = ev.targetTouches ? ev.targetTouches[0].clientY : ev.clientY;
    
            me.processInput(x, y); // Process movement regardless of device
        }
    
        // Desktop: Mouse down for serve, mouse move for paddle control
        this.renderer.domElement.addEventListener("mousedown", function (ev) {
            if (state === STATES.SERVING) {
                try {
                    me.serve(); // Desktop: Mouse down anywhere serves
                } catch (error) {
                    console.warn('Desktop Serve error:', error);
                    // Fallback serve (ensure 'me' context for paddle/ball)
                    state = STATES.PLAYING;
                    me.ball.position.set(me.paddle.position.x, me.paddle.position.y + paddleSize.height, me.paddle.position.z);
                    let dir = new THREE.Vector3(0, -0.5, -1);
                    me.simulation.hitBall(dir, 0.02);
                }
            }
        });
        this.renderer.domElement.addEventListener("mousemove", inputHandler);
    
    
        // Mobile: Touch start for serve (single tap), touch move for paddle control
        this.renderer.domElement.addEventListener("touchstart", function (ev) {
            console.log('MOBILE TOUCH: touchstart event fired, state:', state, 'touches:', ev.targetTouches.length);
    
            // Prevent default touch behavior (e.g., scrolling, zooming)
            ev.preventDefault();
    
            // Handle serving on a single tap
            if (state === STATES.SERVING && ev.targetTouches.length === 1) {
                try {
                    console.log('MOBILE TOUCH: attempting to serve (single tap)');
                    me.serve();
                } catch (error) {
                    console.warn('Touch serve error:', error);
                    // Fallback serve (ensure 'me' context for paddle/ball)
                    state = STATES.PLAYING;
                    me.ball.position.set(me.paddle.position.x, me.paddle.position.y + paddleSize.height, me.paddle.position.z);
                    let dir = new THREE.Vector3(0, -0.5, -1);
                    me.simulation.hitBall(dir, 0.02);
                }
            }
            
            // Always pass to inputHandler for immediate paddle positioning (even on touchstart)
            // This ensures the paddle jumps to the initial touch position.
            inputHandler(ev); 
        }, { passive: false }); // Use passive: false to allow preventDefault
    
        this.renderer.domElement.addEventListener("touchmove", inputHandler, { passive: false }); // Use passive: false to allow preventDefault
    
    
        // Fallback: Force remove any blocking overlays after 5 seconds
        setTimeout(function () {
            let audioOverlay = document.getElementById('audio-unlock-overlay');
            if (audioOverlay) {
                console.log('MOBILE FIX: Force removing stuck audio overlay');
                audioOverlay.remove();
            }
        }, 5000);
    }
    
    processInput(x, y) {
        // Both mobile and desktop will now use the raw x, y coordinates
        // and map them directly to the screen.
        // The previous touchpad zone logic is removed.
    
        console.log("Processing input:", x, y, "on screen size:", this.screenSize.width, this.screenSize.height);
    
        // Map screen X to game X (full width)
        this.input.x = x; // Use the raw X coordinate
    
        // Map screen Y to game Y (a portion of screen height for forward/backward)
        // We want a range for Y movement, let's say roughly the middle 50% of the screen height
        // Adjust these multipliers and offsets to control how much vertical screen movement
        // translates to paddle forward/backward movement.
        // Example: Map Y from 0 to 1 across the screen's height to a smaller range for paddle Z
        // If paddle moves along Z, map screen Y to paddle Z.
        // A common approach is to map a section of the screen (e.g., top 60% of screen) to the table's depth.
        let paddleZRangeFactor = 0.5; // Controls how much of the screen's height affects paddle Z
        let paddleZOffsetFactor = 0.25; // Shifts the effective Y range on screen
    
        this.input.y = (y / this.screenSize.height) * this.screenSize.height * paddleZRangeFactor + (this.screenSize.height * paddleZOffsetFactor);
        // The above calculation for this.input.y might still need fine-tuning
        // depending on what this.input.y actually controls (is it paddle Z or paddle Y?).
        // If this.input.y controls the Z position of the paddle in 3D space:
        // It should map screen Y (vertical) to world Z (depth).
        // Let's assume positive Y screen means further down, and further Z means closer to player.
        // So, larger screen Y should mean larger world Z.
    
        // A more direct mapping example:
        // Map the screen's Y-coordinate (0 to screenSize.height) to a desired Z-range for the paddle.
        // Let's say paddle can move from zMin to zMax.
        // const paddleZMin = -2; // Example: furthest back from net
        // const paddleZMax = 2;  // Example: closest to net
        // this.input.y = (y / this.screenSize.height) * (paddleZMax - paddleZMin) + paddleZMin;
        // THIS IS A HYPOTHETICAL MAPPING. YOU NEED TO ADAPT THIS BASED ON YOUR GAME'S COORDINATE SYSTEM.
    
        // Given your original `this.input.y = touchpadY * this.screenSize.height * 0.4 + this.screenSize.height * 0.3;`
        // was effectively mapping a normalized 0-1 touchpad Y to a screen Y range:
        // We'll revert to simply using screen Y, and you should adjust what 'this.input.y' *means* in your game logic.
        // For now, let's remove the mapping and let your game logic handle it.
        this.input.x = x; // Raw screen X
        this.input.y = y; // Raw screen Y
    
        // Your game logic (e.g., in `GameScene` or paddle update) will then map these `this.input.x` and `this.input.y`
        // to your 3D paddle's X and Z (depth) coordinates based on the camera's perspective.
        // Example: paddle.position.x = this.input.x * scaleX;
        //          paddle.position.z = this.input.y * scaleZ; (where scaleZ accounts for perspective)
    }

    serve() {
        state = STATES.PLAYING;
        ball.position.set(this.paddle.position.x, this.paddle.position.y + paddleSize.height, this.paddle.position.z);

        let dir = new THREE.Vector3(0, -0.5, -1);
        this.simulation.hitBall(dir, 0.02);

        // Reset scoring tracking for new rally
        lastHitter = 'player'; // Player served
        ballBouncedOnOpponentSide = false;
        ballHitTable = false;


    }

    update() {
        if (state === STATES.LOADING) {
            return;
        }

        if (state === STATES.PLAYING) {
            this.ai.play();
            this.simulation.simulate();
        }

        let px = (this.input.x / this.screenSize.width) * 2 - 1;
        let py = - (this.input.y / this.screenSize.height) * 2 + 1;

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
        this.paddle.position.x = intersect.x;
        this.paddle.position.z = intersect.z;
        this.paddle.position.y = this.tableSize.height;



        if (state == STATES.SERVING) {
            ball.position.set(this.paddle.position.x, this.paddle.position.y + paddleSize.height, this.paddle.position.z);
        }
        else {
            this.checkBallHit();

            // Check for ball out of bounds and scoring
            this.checkBallOutOfBounds();
        }

        //set paddle rotation
        let dx = Math.min(1, Math.abs(this.paddle.position.x / (this.tableSize.width * 0.6)));
        let dxAI = Math.min(1, Math.abs(this.paddleAI.position.x / (this.tableSize.width * 0.6)));


        this.paddle.rotation.z = Math.PI * 0.5 * dx * (this.paddle.position.x > 0 ? -1.0 : 1.0);
        this.paddle.rotation.x = Math.PI * 0.2 * dx;
        this.paddle.rotation.y = Math.PI * 0.2 * dx * (this.paddle.position.x > 0 ? 1.0 : -1.0);

        this.paddleAI.rotation.z = Math.PI * 0.5 * dxAI * (this.paddleAI.position.x > 0 ? 1.0 : -1.0);
        this.paddleAI.rotation.x = -Math.PI * 0.2 * dxAI;
        this.paddleAI.rotation.y = Math.PI * 0.2 * dxAI * (this.paddleAI.position.x > 0 ? -1.0 : 1.0);
        this.paddleAI.rotation.y += Math.PI;

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
        if (this.simulation.getLinearVelocity().z > 0 && this.paddle.position.z > ball.position.z) {
            //store trayectory
            let trayectory = {
                time: Date.now(),
                x: this.paddle.position.x,
                y: this.paddle.position.y,
                z: this.paddle.position.z
            }
            paddleTrajectory.push(trayectory);

            //check hit distances
            let zDistance = this.paddle.position.z - ball.position.z;
            let xDistance = Math.abs(this.paddle.position.x - ball.position.x);
            let yDistance = this.paddle.position.y - ball.position.y;
            hit = zDistance < this.tableSize.depth * 0.03 && xDistance < paddleSize.width && Math.abs(yDistance) < paddleSize.height * 0.75;
            hitting = zDistance < this.tableSize.depth * 0.2 && xDistance < paddleSize.width;
        }

        //target paddle y position
        let targetY = this.tableSize.height;
        if (hitting) {
            targetY = ball.position.y;
        }
        let diffY = this.paddle.position.y - targetY;
        this.paddle.position.y += Math.min(Math.abs(diffY), paddleSize.height * 0.1) * (diffY ? -1 : 1);

        if (hit) {
            let trayectory = calculatePaddleTrajectory(paddleTrajectory);
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
            if (this.paddle.position.z < this.tableSize.depth / 2) {
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

    updateCategorySounds(sounds){
        this.simulation.audio.categorySounds = sounds;
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