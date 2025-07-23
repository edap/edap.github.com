import * as THREE from "three"
import { Physics, calculatePaddleTrajectory } from "./physics.js";
import AI from "./AI.js"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { isMobile, setupLighting, setBallPosition } from "./utils.js";
import { updateCameraForTableVisibility } from "./camera_utils.js";
import Stats from 'three/addons/libs/stats.module.js'
import { updateScoreUI } from './ui_score.js';
import { createBGMaterial } from './background.js';
import { createBall, createPaddles, createTable, createNet } from "./model_utils.js";
import { InputManager } from "./input_manager.js"; // Import the new manager
import { STATES } from "./constants.js";

let controls; // This can probably remain global if only used for debug controls or removed if not needed.

let paddleTrajectory = []; // This should probably also be an instance variable of GameScene if it's related to the current game instance.

class GameScene {
    constructor(renderer, settings) {
        this.inputManager = null;
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
        this.stats = new Stats();
        this.controls = null;
        this.ai = null;
        this.score = { player: 0, ai: 0 };
        this.paddle;
        this.paddleAI;
        this.paddleSize = {};
        this.ballRadius = 0;
        this.ball = null;
        this.lastHitter = null; // 'player' or 'ai'
        this.ballBouncedOnOpponentSide = false; // Track if ball bounced on opponent's side
        this.ballHitTable = false; // Track if ball hit table at all

        this.state = STATES.LOADING;
    }

    init(randomSounds, ballSounds, glbModel) {
        this.scene.add(this.camera);
        this.camera.position.set(0, 1, 3);
        this.camera.lookAt(this.scene.position);
        this.stats.showPanel(0);

        if (this.settings.debug) {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            document.body.appendChild(this.stats.dom);
        }
        this.simulation.init(this.settings, randomSounds, ballSounds)
        setupLighting(this.scene);

        this.parseGlb(glbModel)

        // Pass 'this' (the GameScene instance) to InputManager
        this.inputManager = new InputManager(this.renderer.domElement, this);
        this.inputManager.initListeners();
        updateScoreUI(this.score);
    }

    parseGlb = (glb) => {
        this.tableSize = {};
        const objectScaleFactor = (isMobile() && this.settings.mobile && this.settings.mobile.objectScale) ? this.settings.mobile.objectScale : 1;

        const table = createTable(glb, this.settings, this.simulation, this.scene, this.tableSize);
        if (!table) {
            console.error("Failed to load table model.");
            return;
        }

        const net = createNet(glb, this.settings, this.simulation, this.scene, this.tableSize);
        if (!net) {
            console.warn("Net model not found or created.");
        }

        const paddles = createPaddles(glb, this.scene, this.tableSize, this.settings, objectScaleFactor);
        this.paddle = paddles.player;
        this.paddleAI = paddles.ai;
        this.paddleSize = paddles.size;
        if (!this.paddle || !this.paddleAI) {
            console.error("Failed to load or create paddles.");
            return;
        }
        const ballCreated = createBall(this.scene, this.simulation, this.tableSize, this.paddleSize, objectScaleFactor);

        if (!ballCreated) {
            console.error("Failed to create ball.");
            return;
        }
        this.ballRadius = ballCreated.radius;
        this.ball = ballCreated.object;

        this.inputPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), this.tableSize.height * 0.95);

        updateCameraForTableVisibility(this.tableSize, this.camera, this.screenSize);

        this.ai = new AI(this.simulation, this.tableSize, this.paddleAI, this.paddleSize, this.ball, this.ballRadius);

        // Update to instance state:
        this.state = STATES.SERVING; // <-- USE this.state
    }

    fallbackServe() {
        // Update to instance state:
        this.state = STATES.PLAYING; // <-- USE this.state
        this.ball.position.set(this.paddle.position.x, this.paddle.position.y + this.paddleSize.height, this.paddle.position.z);
        let dir = new THREE.Vector3(0, -0.5, -1);
        this.simulation.hitBall(dir, 0.02);
    }

    processInput(x, y) {
        this.input.x = x;
        this.input.y = y;

        if (isMobile()) {
            const mobileYOffsetPixels = -40;
            this.input.y += mobileYOffsetPixels;
        }
    }

    serve() {
        // Update to instance state:
        this.state = STATES.PLAYING; // <-- USE this.state
        this.ball.position.set(this.paddle.position.x, this.paddle.position.y + this.paddleSize.height, this.paddle.position.z);

        let dir = new THREE.Vector3(0, -0.5, -1);
        this.simulation.hitBall(dir, 0.02);

        this.lastHitter = 'player';
        this.ballBouncedOnOpponentSide = false;
        this.ballHitTable = false;
    }

    update() {
        // Update to instance state:
        if (this.state === STATES.LOADING) { // <-- USE this.state
            return;
        }

        // Update to instance state:
        if (this.state === STATES.PLAYING) { // <-- USE this.state
            this.ai.play();
            this.simulation.simulate();
        }

        let px = (this.input.x / this.screenSize.width) * 2 - 1;
        let py = - (this.input.y / this.screenSize.height) * 2 + 1;

        let maxpy = Math.min(0, py);
        let vector = new THREE.Vector3(px, maxpy, 0.5);
        vector.unproject(this.camera);
        let ray = new THREE.Ray(this.camera.position, vector.sub(this.camera.position).normalize());
        let intersect = new THREE.Vector3(0, 0, 0);
        ray.intersectPlane(this.inputPlane, intersect);

        if (!intersect) {
            intersect = this.paddle.position.clone();
        }

        let minZ = this.tableSize.depth * 0.10;
        let maxZ = this.tableSize.depth * 0.60;
        let maxX = this.tableSize.width * 0.50;

        intersect.z = Math.max(minZ, Math.min(maxZ, intersect.z));
        intersect.x = Math.max(-maxX, Math.min(maxX, intersect.x));

        this.paddle.position.x = intersect.x;
        this.paddle.position.z = intersect.z;
        if (this.state == STATES.SERVING) {
            this.paddle.position.z = this.tableSize.depth / 2;
        }
        this.paddle.position.y = this.tableSize.height;



        let dx = Math.min(1, Math.abs(this.paddle.position.x / (this.tableSize.width * 0.6)));
        let dxAI = Math.min(1, Math.abs(this.paddleAI.position.x / (this.tableSize.width * 0.6)));

        this.paddle.rotation.z = Math.PI * 0.5 * dx * (this.paddle.position.x > 0 ? -1.0 : 1.0);
        this.paddle.rotation.x = Math.PI * 0.2 * dx;
        this.paddle.rotation.y = Math.PI * 0.2 * dx * (this.paddle.position.x > 0 ? 1.0 : -1.0);

        this.paddleAI.rotation.z = Math.PI * 0.5 * dxAI * (this.paddleAI.position.x > 0 ? 1.0 : -1.0);
        this.paddleAI.rotation.x = -Math.PI * 0.2 * dxAI;
        this.paddleAI.rotation.y = Math.PI * 0.2 * dxAI * (this.paddleAI.position.x > 0 ? -1.0 : 1.0);
        this.paddleAI.rotation.y += Math.PI;

        if (this.state == STATES.SERVING) {
            setBallPosition(this.paddle, this.ballRadius, this.ball)
        } else {
            this.checkBallHit();
            this.checkBallOutOfBounds();
        }
    }

    checkBallOutOfBounds() {
        let ballOutOfBounds = false;
        let scoreForPlayer = false;
        let scoreForAI = false;
        let reasonForPoint = '';

        let ballNearTable = Math.abs(this.ball.position.y - this.tableSize.height) < this.ballRadius * 2 &&
            Math.abs(this.ball.position.x) < this.tableSize.width * 0.5 &&
            Math.abs(this.ball.position.z) < this.tableSize.depth * 0.5;

        if (ballNearTable && !this.ballHitTable) {
            this.ballHitTable = true;
            if (this.ball.position.z > 0) {
                if (this.lastHitter === 'ai') {
                    this.ballBouncedOnOpponentSide = true;
                }
            } else {
                if (this.lastHitter === 'player') {
                    this.ballBouncedOnOpponentSide = true;
                }
            }
        }

        if (Math.abs(this.ball.position.x) > this.tableSize.width * 0.6) {
            ballOutOfBounds = true;
            reasonForPoint = 'Ball went off side of table';
        }

        if (this.ball.position.y < this.tableSize.height * 0.3) {
            ballOutOfBounds = true;
            reasonForPoint = 'Ball fell below table';
        }

        if (this.ball.position.z > this.tableSize.depth * 0.7) {
            ballOutOfBounds = true;
            reasonForPoint = 'Ball went past player';
        }

        if (this.ball.position.z < -this.tableSize.depth * 0.7) {
            ballOutOfBounds = true;
            reasonForPoint = 'Ball went past AI';
        }

        if (ballOutOfBounds) {
            if (this.lastHitter === 'player') {
                if (!this.ballBouncedOnOpponentSide) {
                    scoreForAI = true;
                    reasonForPoint += ' (Player hit, no bounce on AI side)';
                } else {
                    scoreForPlayer = true;
                    reasonForPoint += ' (Ball bounced on AI side after player hit)';
                }
            } else if (this.lastHitter === 'ai') {
                if (!this.ballBouncedOnOpponentSide) {
                    scoreForPlayer = true;
                    reasonForPoint += ' (AI hit, no bounce on player side)';
                } else {
                    scoreForAI = true;
                    reasonForPoint += ' (Ball bounced on player side after AI hit)';
                }
            } else {
                if (this.ball.position.z > 0) {
                    scoreForAI = true;
                } else {
                    scoreForPlayer = true;
                }
                reasonForPoint += ' (Fallback rule)';
            }

            if (scoreForPlayer) {
                this.score.player++;
            } else if (scoreForAI) {
                this.score.ai++;
            }

            updateScoreUI(this.score);

            // Update to instance state:
            this.state = STATES.SERVING; // <-- USE this.state

            this.ball.position.set(0, this.tableSize.height * 2, this.tableSize.depth * 0.25);
        }
    }

    checkBallHit() {
        let hitting = false;
        let hit = false;
        if (this.simulation.getLinearVelocity().z > 0 && this.paddle.position.z > this.ball.position.z) {
            let trayectory = {
                time: Date.now(),
                x: this.paddle.position.x,
                y: this.paddle.position.y,
                z: this.paddle.position.z
            }
            paddleTrajectory.push(trayectory);

            let zDistance = this.paddle.position.z - this.ball.position.z;
            let xDistance = Math.abs(this.paddle.position.x - this.ball.position.x);
            let yDistance = this.paddle.position.y - this.ball.position.y;
            hit = zDistance < this.tableSize.depth * 0.03 && xDistance < this.paddleSize.width && Math.abs(yDistance) < this.paddleSize.height * 0.75;
            hitting = zDistance < this.tableSize.depth * 0.2 && xDistance < this.paddleSize.width;
        }

        let targetY = this.tableSize.height;
        if (hitting) {
            targetY = this.ball.position.y;
        }
        let diffY = this.paddle.position.y - targetY;
        this.paddle.position.y += Math.min(Math.abs(diffY), this.paddleSize.height * 0.1) * (diffY ? -1 : 1);

        if (hit) {
            let trayectory = calculatePaddleTrajectory(paddleTrajectory);
            trayectory.z = Math.min(trayectory.z, 0);

            let dir = new THREE.Vector3(0, 0, 0);
            dir.z = -1.0;
            let tx = trayectory.x / (this.tableSize.width * 0.1);
            dir.x = 0.6 * Math.min(Math.abs(tx), 1.0) * (tx > 0 ? 1 : -1);
            let tz = trayectory.z / (this.tableSize.depth * 0.25);
            tz = Math.min(Math.abs(tz), 1);
            let force = 0.02 + tz * 0.01;

            dir.y = 0.4;
            if (this.ball.position.y < this.tableSize.height) {
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
            paddleTrajectory.length = 0;

            this.lastHitter = 'player';
            this.ballBouncedOnOpponentSide = false;
            this.ballHitTable = false;
        }
    }

    updateCategorySounds(sounds) {
        this.simulation.audio.categorySounds = sounds;
    }

    resize(width, height) {
        this.camera.aspect = width / height;

        this.screenSize.width = width;
        this.screenSize.height = height;

        if (this.tableSize) {
            updateCameraForTableVisibility(this.tableSize, this.camera, this.screenSize);
        }

        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.bg.uniforms.ratio.value = width / height;
    }

    render() {
        if (this.settings.debug) {
            this.stats.begin();
        }
        this.update();
        this.renderer.render(this.scene, this.camera);
        if (this.settings.debug) { this.stats.end() };
    }
}

export default GameScene;