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
import { InputManager } from "./input_manager.js";
import { STATES, SERVE_AFTER_ERROR_DELAY } from "./constants.js";
import { drawArrow } from "./debug_helpers.js";
import {
    checkBallHitTable as checkBallHitTableRule,
    isBallOffSide,
    isBallBelowTable,
    isBallPastPlayerBoundary,
    isBallPastAIBoundary,
    determineScorer,
} from './game_rules.js';

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
        this.paddleTrajectory = [];
        this.debugArrow = null;
        this.paddleTip = new THREE.Vector3();

        this.state = STATES.LOADING;
        this.pointScoredTime = 0;

        this.tempVector = new THREE.Vector3();
        this.tempRay = new THREE.Ray();
        this.tempIntersect = new THREE.Vector3();
        this.tempPlane = new THREE.Plane();
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

        if (this.settings.debug) {
            this.debugArrow = drawArrow(this.scene, new THREE.Vector3(), new THREE.Vector3(0, 1, 0), 0.5, 0.1, 0.05);
        }
    }
    // This is already correctly set as an arrow function
    setLastHitter = (hitter) => {
        this.lastHitter = hitter;
        this.ballBouncedOnOpponentSide = false;
        this.ballHitTable = false;
        //console.log(`GameScene: lastHitter set to ${hitter}`);
    }

    parseGlb = (glb) => {
        this.tableSize = {};
        const objectScaleFactor = (isMobile() && this.settings.mobile && this.settings.mobile.objectScale) ? this.settings.mobile.objectScale : 1;
        //const objectScaleFactor = 1.6;
        const table = createTable(glb, this.settings, this.simulation, this.scene, this.tableSize);
        if (!table) {
            console.error("Failed to load table model.");
            return;
        }

        const net = createNet(glb, this.settings, this.simulation, this.scene, this.tableSize, objectScaleFactor);
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

        // Correctly passing the arrow function
        this.ai = new AI(this.simulation, this.tableSize, this.paddleAI, this.paddleSize, this.ball, this.ballRadius, this.setLastHitter);

        this.state = STATES.SERVING;
    }

    fallbackServe() {
        this.state = STATES.PLAYING;
        this.ball.position.set(this.paddle.position.x, this.paddle.position.y + this.paddleSize.height, this.paddle.position.z);
        let dir = new THREE.Vector3(0, -0.5, -1);
        this.simulation.hitBall(dir, 0.02);
        // Using setLastHitter for fallback serve as well
        this.setLastHitter('player');
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
        this.state = STATES.PLAYING;
        this.ball.position.set(this.paddle.position.x, this.paddle.position.y + this.paddleSize.height, this.paddle.position.z);

        let dir = new THREE.Vector3(0, -0.5, -1);
        this.simulation.hitBall(dir, 0.02);

        // Use the setLastHitter function
        this.setLastHitter('player');
    }

    update() {
        if (this.state === STATES.LOADING) {
            return;
        }

        if (this.state === STATES.PLAYING) {
            this.ai.play();
            this.simulation.simulate();
            //this.simulation.simulate();
            this.checkBallHit();
            this.checkPointConditions();
        }else if (this.state === STATES.POINT_SCORED) {
            const delayDuration = SERVE_AFTER_ERROR_DELAY;
            if (Date.now() - this.pointScoredTime > delayDuration) {
                // Delay has passed, now reset the game for the next serve
                this.state = STATES.SERVING;
                this.ball.position.set(0, this.tableSize.height * 2, this.tableSize.depth * 0.25);
                this.setLastHitter(null);
                this.simulation.lastCollidedBoxName = null;
            }
        }

        let px = (this.input.x / this.screenSize.width) * 2 - 1;
        let py = - (this.input.y / this.screenSize.height) * 2 + 1;

        let maxpy = Math.min(0, py);
        //let vector = new THREE.Vector3(px, maxpy, 0.5);
        this.tempVector.set(px, maxpy, 0.5);
        this.tempVector.unproject(this.camera);
        // Replace: let ray = new THREE.Ray(this.camera.position, vector.sub(this.camera.position).normalize());
        this.tempRay.origin.copy(this.camera.position);
        this.tempRay.direction.copy(this.tempVector).sub(this.camera.position).normalize();

        // Replace: let intersect = new THREE.Vector3(0, 0, 0);
        // Replace: ray.intersectPlane(this.inputPlane, intersect);
        // Use this.tempIntersect directly for the result
        this.tempRay.intersectPlane(this.inputPlane, this.tempIntersect);

        if (!this.tempIntersect) { // Check the reused object
            this.tempIntersect.copy(this.paddle.position); // Use copy instead of clone if possible
        }

        let minZ = this.tableSize.depth * 0.10;
        let maxZ = this.tableSize.depth * 0.60;
        let maxX = this.tableSize.width * 0.50;

        this.tempIntersect.z = Math.max(minZ, Math.min(maxZ, this.tempIntersect.z));
        this.tempIntersect.x = Math.max(-maxX, Math.min(maxX, this.tempIntersect.x));


        this.paddle.position.x = this.tempIntersect.x;
        this.paddle.position.z = this.tempIntersect.z;
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
        }
        //  else {
        //     this.checkBallHit();
        //     this.checkPointConditions();
        // }
    }

    checkPointConditions() {
        let scoreForPlayer = false;
        let scoreForAI = false;
        let reasonForPoint = '';
        let pointScored = false;

        // --- Update ball hit table state ---
        const ballHitTableResult = checkBallHitTableRule(
            this.ball,
            this.tableSize,
            this.ballRadius,
            this.lastHitter,
            this.ballHitTable
        );
        this.ballHitTable = ballHitTableResult.ballHitTable;
        // Only update ballBouncedOnOpponentSide if it's set to true by the function
        // This ensures it doesn't get reset if it was already true from a previous check
        if (ballHitTableResult.ballBouncedOnOpponentSide) {
             this.ballBouncedOnOpponentSide = true;
        }

        // net?
        if (this.lastHitter && this.simulation.lastCollidedBoxName === 'net') {
            pointScored = true;
            reasonForPoint = `Ball hit the net after ${this.lastHitter} hit.`;
            if (this.lastHitter === 'player') {
                scoreForAI = true;
                reasonForPoint += ' (Player fault)';
            } else { // lastHitter === 'ai'
                scoreForPlayer = true;
                reasonForPoint += ' (AI fault)';
            }
        }

        else if (isBallOffSide(this.ball, this.tableSize)) {
            pointScored = true;
            reasonForPoint = 'Ball went off side of table';
        } else if (isBallBelowTable(this.ball, this.tableSize)) {
            pointScored = true;
            reasonForPoint = 'Ball fell below table';
        } else if (isBallPastPlayerBoundary(this.ball, this.tableSize)) {
            pointScored = true;
            reasonForPoint = 'Ball went past player';
        } else if (isBallPastAIBoundary(this.ball, this.tableSize)) {
            pointScored = true;
            reasonForPoint = 'Ball went past AI';
        }

        if (pointScored) {
            this.state = STATES.POINT_SCORED; // Set the new state
            this.pointScoredTime = Date.now();
            let scorer = determineScorer(this.lastHitter, this.ballBouncedOnOpponentSide, this.ball.position.z);
            if (scorer === 'player') {
                scoreForPlayer = true;
            } else if (scorer === 'ai') {
                scoreForAI = true;
            }

            if (scoreForPlayer) {
                this.score.player++;
            } else if (scoreForAI) {
                this.score.ai++;
            }

            updateScoreUI(this.score);
            //console.log(reasonForPoint);

            // this.state = STATES.SERVING;
            // this.ball.position.set(0, this.tableSize.height * 2, this.tableSize.depth * 0.25);
            // this.setLastHitter(null);
            // this.simulation.lastCollidedBoxName = null;
        }
    }


    checkBallHit() {
        let hitting = false;
        let hit = false;
        //console.log(this.simulation.getLinearVelocity().z)
        if (this.simulation.getLinearVelocity().z > 0 && this.paddle.position.z > this.ball.position.z) {
            let trayectory = {
                time: Date.now(),
                x: this.paddle.position.x,
                y: this.paddle.position.y,
                z: this.paddle.position.z
            }
            this.paddleTrajectory.push(trayectory);

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
            let trayectory = calculatePaddleTrajectory(this.paddleTrajectory);
            trayectory.z = Math.min(trayectory.z, 0);

            let dir = new THREE.Vector3(0, 0, 0);
            dir.z = -1.0;
            let tx = trayectory.x / (this.tableSize.width * 0.1);
            dir.x = 0.6 * Math.min(Math.abs(tx), 1.0) * (tx > 0 ? 1 : -1);
            let tz = trayectory.z / (this.tableSize.depth * 0.25);
            tz = Math.min(Math.abs(tz), 1);
            let force = 0.02 + tz * 0.01;

            dir.y = 0.45;
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
            this.paddleTrajectory.length = 0;

            // Use the setLastHitter function
            this.setLastHitter('player');
        }

        if (this.settings.debug) {
            const paddleTipMarker = this.paddle.getObjectByName('paddle-tip');
            if (paddleTipMarker) {
                paddleTipMarker.getWorldPosition(this.paddleTip);

                this.debugArrow.position.copy(this.paddleTip);
                if (hit) {
                    this.debugArrow.setDirection(this.simulation.getLinearVelocity());
                }
            }
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