/* 
 * PingPongWebGL is licensed under MIT licensed. See LICENSE.md file for more information.
 * Copyright (c) 2014 Imanol Fernandez @MortimerGoro
*/

import * as THREE from "three"

class PingPong {
    constructor(){
    let camera, scene, controls;

    let screenSize, tableSize, paddleSize, ballSize;
    let paddle, paddleAI;
    let paddleTrajectory = [];
    let ball;
    let STATES = {
        LOADING: 0,
        SERVING: 1,
        PLAYING: 2
    }
    let state = STATES.LOADING;
    let input = {x:0, y: 0};
    let inputPlane;
    let projector = new THREE.Projector();
    
    // Add scoreboard letiables
    let playerScore = 0;
    let aiScore = 0;
    let scoreboardMesh = null;
    
    // Realistic ping pong scoring letiables
    let lastHitter = null; // 'player' or 'ai'
    let ballBouncedOnOpponentSide = false; // Track if ball bounced on opponent's side
    let ballHitTable = false; // Track if ball hit table at all
    let ballRadius = 0; // Global ballRadius for scoring calculations
    
    // Model switching system for testing different tables
    let TABLE_MODELS = {
        ORIGINAL: {
            model: './models/table.js',
            name: 'Original Table',
            type: 'json'
        },
        FAB_OBJ: {
            model: './models/downloaded/tisch_mit_sitze_alt.obj',
            name: 'Fab.com Table with Seats (OBJ)',
            type: 'obj'
        },
        FAB_FBX: {
            model: './models/downloaded/table-tennis/1.fbx',
            name: 'Fab.com Table (FBX)',
            type: 'fbx',
            fallback: './models/table.js' // Use original as fallback
        }
    };
    
    // Set which table model to use - EASILY CHANGEABLE
    let CURRENT_TABLE = 'ORIGINAL'; // Back to the reliable original
    }
}



class GameScene {
    constructor(renderer, settings) {
        this.renderer = renderer;
        this.settings = settings;
        this.init();
    }

    //THREE.utils.enableDebug(scene);


    
    init() {
        if (window.PingPong && PingPong.MobileDebug) {
            PingPong.MobileDebug.logGameState('INITIALIZING', 'Starting game scene setup');
        }
        
        //create scene
    	scene = new THREE.Scene();
        screenSize = {width:window.innerWidth, height: window.innerHeight};
        window.screenSize = screenSize; // Make accessible for resize handler
		//initialize camera
		camera = new THREE.PerspectiveCamera( 45, screenSize.width/screenSize.height, 0.5, 20);
		scene.add(camera);
		camera.position.set(0,this.settings.height/2,this.settings.depth/2);
		camera.lookAt(scene.position);
        
        //initialize audio
        if (PingPong.MobileDebug) PingPong.MobileDebug.logGameState('AUDIO_INIT', 'Initializing audio system');
        PingPong.Audio.init(this.settings);
        
        //create physics
        this.simulation = new PingPong.Physics();
        
        //initialize world
        this.loadPlanes();
        this.loadLight();
        this.loadModels();
        this.initInput();

		//controls = new THREE.OrbitControls( camera, this.renderer.domElement );
    }
    
    loadPlanes() {
        let planes = this.settings.planes;
        for (let i = 0; i < planes.length; ++i) {
            let plane = planes[i];
            if (i > 0 || navigator.isCocoonJS) {
                let planeMaterial = new THREE.MeshBasicMaterial( { map: new THREE.ImageUtils.loadTexture(plane.texture),side: THREE.DoubleSide} ); 
            }
            else { //light on the floor (test)
                let planeMaterial = new THREE.MeshPhongMaterial( { map: new THREE.ImageUtils.loadTexture(plane.texture),ambient:0x333333, side: THREE.DoubleSide} ); 
            }
            planeMaterial.map.wrapS = THREE.RepeatWrapping; 
            planeMaterial.map.wrapT = THREE.RepeatWrapping; 
            let repeat = plane.repeat || [1,1];
            planeMaterial.map.repeat.set(repeat[0],repeat[1]);
            
            let planeGeometry = new THREE.PlaneGeometry(plane.size[0], plane.size[1], 10, 10);
            let planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
            
            if (plane.rotation) {
                planeMesh.rotation.set(plane.rotation[0], plane.rotation[1], plane.rotation[2]);
            }
            if (plane.scale) {
                planeMesh.scale.set(plane.scale[0], plane.scale[1], plane.scale[2]);
            }
            if (plane.position) {
                planeMesh.position.set(plane.position[0], plane.position[1], plane.position[2]);
            }
            scene.add(planeMesh);
            
            // FLOOR CYCLING: Store reference to floor mesh (first plane)
            if (i === 0 && FloorCycler.enabled) {
                FloorCycler.init(planeMesh);
            }
        }
    }
    
    loadLight() {

        if (navigator.isCocoonJS) {

            let directionalLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
            directionalLight.position.set( 0, 20, 20 );
            scene.add( directionalLight );
        }
        else {
            let light = new THREE.PointLight(0xffffff);
            light.position.set(0,2.5,2);
            scene.add(light);
            
            light = new THREE.SpotLight( 0xffffff, 0.8 );
                    light.position.set( 0, 2.0, 4.0 );
                    light.target.position.set( 0, 0, 0.2 );
                    light.target.updateMatrixWorld();
            scene.add(light);
        }
    }

    loadModels() {
        
        let me = this;
        
        // Get current table model settings
        let currentTableConfig = TABLE_MODELS[CURRENT_TABLE];
        let modelPath = currentTableConfig.model;
        let modelName = currentTableConfig.name;
        let modelType = currentTableConfig.type;
        
        console.log('🏓 Loading Table Model:', modelName);
        console.log('📁 Model Path:', modelPath);
        console.log('🔧 Model Type:', modelType);
        
        // Handle unsupported formats
        if (modelType === 'fbx') {
            console.warn('⚠️ FBX format detected but not supported in THREE.js v60');
            if (currentTableConfig.fallback) {
                console.log('🔄 Using fallback model:', currentTableConfig.fallback);
                modelPath = currentTableConfig.fallback;
                modelName += ' (Fallback)';
                modelType = 'json';
            }
        }
        
		if (PingPong.MobileDebug) PingPong.MobileDebug.logLoadingProgress('Table Model', 0, 2);
		
		// Update loading message
		if (document.getElementById('loadingMessage')) {
		    document.getElementById('loadingMessage').innerHTML = 'Loading ' + modelName + '...';
		}
		
		// Use appropriate loader based on model type
		if (modelType === 'obj') {
		    let loader = new THREE.OBJLoader();
		    loader.load(modelPath, onOBJTableLoad);
		} else {
		    let loader = new THREE.JSONLoader();
		    loader.load(modelPath, onTableLoad);
		}

		const onTableLoad = ( geometry, materials ) => {
            if (PingPong.MobileDebug) PingPong.MobileDebug.logLoadingProgress('Table Model', 1, 2);
            
            // Log successful model loading
            console.log('✅ Table model loaded successfully:', modelName);
            
            // Add debug info overlay
            me.createModelDebugOverlay(modelName);
            
            //change the table color or texture
            let tableSettings = {ambient: 0x000000, specular: 0x777777 };
            if (me.settings.table.texture) {
                tableSettings.map = THREE.ImageUtils.loadTexture(me.settings.table.texture);
            }
            else {
                tableSettings.color = me.settings.table.color;
            }
			let m = new THREE.MeshPhongMaterial(tableSettings);
            if (m.map) {
                m.map.repeat.x = 0.1;
                m.map.repeat.y = 0.03;
                m.map.wrapS = THREE.RepeatWrapping;
                m.map.wrapT = THREE.RepeatWrapping;   
            }			
			materials[1] = m;

            //compute the model size
			let table = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial(materials) );
            geometry.computeBoundingBox();
            let boundingBox = geometry.boundingBox;
            let modelSize = {width: boundingBox.max.x - boundingBox.min.x, 
                             depth: boundingBox.max.z - boundingBox.min.z, 
                             height: boundingBox.max.y - boundingBox.min.y};
            
            //scale the table according to the aspect ratio and the defined size in settings
            let scale = me.settings.table.width / modelSize.width;
			table.scale.set(scale,scale,scale);
            tableSize = {width: modelSize.width * scale, depth: modelSize.depth * scale, height: modelSize.height * scale, scale: scale};
            
            //Simulation boxes
            let tw = tableSize.width * 0.91;
            let th = tableSize.height * 0.083;
            let ty = tableSize.height * 0.805;
            let tablebox = new THREE.Box3(new THREE.Vector3(0,0,0),new THREE.Vector3(1,1,1));
            tablebox.setFromCenterAndSize(new THREE.Vector3(0,ty,0), new THREE.Vector3(tw, th, tableSize.depth));
            me.simulation.addBox(tablebox);
            
            let wallMode = false;
            if (wallMode) {
                let netBox = new THREE.Box3();
                netBox.setFromCenterAndSize(new THREE.Vector3(0,tableSize.height,0), new THREE.Vector3(tableSize.width, tableSize.height, tableSize.depth * 0.1));
                me.simulation.addBox(netBox);
                
                let netHitCube = new THREE.Mesh(new THREE.CubeGeometry(netBox.max.x - netBox.min.x, netBox.max.y - netBox.min.y, netBox.max.z - netBox.min.z),
                                                       new THREE.MeshBasicMaterial({color:0x000000}))
                netHitCube.position.y = tableSize.height;
                netHitCube.visible = true;
                scene.add(netHitCube);
            }
            
            //Initial camera position - CLOSER for better table visibility
            camera.position.set(0, tableSize.height * 1.4, tableSize.depth/2 * 1.8);
            let vector = new THREE.Vector3(0, tableSize.height, 0);
		    camera.lookAt(vector);
            
            //Initialize the inputPlane
            inputPlane = new THREE.Plane(new THREE.Vector3(0,-1,0), tableSize.height * 0.95);
            
            
            //setup table propeties and add it to the scene
			table.matrixAutoUpdate = false;
			table.updateMatrix();
			scene.add(table);
            
            //load paddles
            loader.load(me.settings.paddle.model, onPaddleLoad);
		}
		
		const onOBJTableLoad = ( object ) =>{
            if (PingPong.MobileDebug) PingPong.MobileDebug.logLoadingProgress('Table Model', 1, 2);
            
            // Log successful model loading
            console.log('✅ OBJ Table model loaded successfully:', modelName);
            console.log('🔍 Object structure:', object);
            
            // Add debug info overlay
            me.createModelDebugOverlay(modelName);
            
            // OBJ models come as Object3D with meshes inside
            let table = object;
            
            // Calculate bounding box for the entire object
            let boundingBox = new THREE.Box3();
            object.traverse(function(child) {
                if (child instanceof THREE.Mesh) {
                    child.geometry.computeBoundingBox();
                    boundingBox.union(child.geometry.boundingBox);
                }
            });
            
            let modelSize = {
                width: boundingBox.max.x - boundingBox.min.x, 
                depth: boundingBox.max.z - boundingBox.min.z, 
                height: boundingBox.max.y - boundingBox.min.y
            };
            
            console.log('📏 Original model size:', modelSize);
            
            //scale the table according to the aspect ratio and the defined size in settings
            let scale = me.settings.table.width / modelSize.width;
            console.log('🔧 Calculated scale:', scale);
            
			table.scale.set(scale, scale, scale);
            tableSize = {width: modelSize.width * scale, depth: modelSize.depth * scale, height: modelSize.height * scale, scale: scale};
            
            console.log('🏓 Final table size:', tableSize);
            
            //Simulation boxes (same as original)
            let tw = tableSize.width * 0.91;
            let th = tableSize.height * 0.083;
            let ty = tableSize.height * 0.805;
            let tablebox = new THREE.Box3(new THREE.Vector3(0,0,0),new THREE.Vector3(1,1,1));
            tablebox.setFromCenterAndSize(new THREE.Vector3(0,ty,0), new THREE.Vector3(tw, th, tableSize.depth));
            me.simulation.addBox(tablebox);
            
            //Initial camera position - CLOSER for better table visibility
            camera.position.set(0, tableSize.height * 1.4, tableSize.depth/2 * 1.8);
            let vector = new THREE.Vector3(0, tableSize.height, 0);
		    camera.lookAt(vector);
            
            //Initialize the inputPlane
            inputPlane = new THREE.Plane(new THREE.Vector3(0,-1,0), tableSize.height * 0.95);
            
            //setup table properties and add it to the scene
			table.matrixAutoUpdate = false;
			table.updateMatrix();
			scene.add(table);
            
            //load paddles (same as original)
            let paddleLoader = new THREE.JSONLoader();
            paddleLoader.load(me.settings.paddle.model, onPaddleLoad);
		}
        
        const onPaddleLoad = (geometry, materials) => {
            if (PingPong.MobileDebug) PingPong.MobileDebug.logLoadingProgress('Paddle Model', 2, 2);
            
            //scale the paddles the same way as the table
            let scale = tableSize.scale;
            
            paddle = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial(materials) );
            paddle.scale.set(scale, scale, scale);
            paddle.position.set(0,tableSize.height, tableSize.depth/2);
            scene.add(paddle);
            

            let mat = new THREE.MeshFaceMaterial(materials, {side:THREE.DoubleSide});
            mat.side = THREE.DoubleSide;
            paddleAI = new THREE.Mesh( geometry, mat );
            paddleAI.scale.set(scale, scale, scale);
            paddleAI.position.set(0,tableSize.height, -tableSize.depth/2);
            scene.add(paddleAI);
            
            geometry.computeBoundingBox();
            let boundingBox = geometry.boundingBox;
            let modelSize = {width: boundingBox.max.x - boundingBox.min.x, 
                             depth: boundingBox.max.z - boundingBox.min.z, 
                             height: boundingBox.max.y - boundingBox.min.y};
            paddleSize = {width: modelSize.width * scale, depth: modelSize.depth * scale, height: modelSize.height * scale, scale: scale};
            
            
            ballRadius = paddleSize.width * 0.13; // Set global ballRadius
            let ballGeometry = new THREE.SphereGeometry(ballRadius,16,16);
            let ballMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff, ambient: 0xcccccc} );
            ball = new THREE.Mesh( ballGeometry, ballMaterial );
            ball.position.set(0,tableSize.height * 2,tableSize.depth * 0.25);
            scene.add(ball);
            me.simulation.setBall(ball, ballRadius);
            
            me.ai = new PingPong.AI(me.simulation, tableSize, paddleAI, paddleSize, ball, ballRadius);
            
            // Set AI difficulty - can be changed to 'easy' or 'hard' 
            // me.ai.setDifficulty('normal'); // TEMPORARILY DISABLED until AI.js is updated
            
            // Create scoreboard on back wall
            me.createScoreboard();
            
            state = STATES.SERVING;
            // Update touchpad message for initial state
            me.updateTouchpadMessage();
            
            if (PingPong.MobileDebug) PingPong.MobileDebug.logGameState('READY', 'All models loaded, game ready to play');
        }
        
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
            me.processInput(x,y);
        }
        
        // Only serve if in SERVING state (prevent multiple balls)
        this.renderer.domElement.addEventListener("mousedown", function(){
            if (state === STATES.SERVING) {
                try {
                    me.serve();
                } catch (error) {
                    console.warn('Serve error:', error);
                    // Fallback serve
                    state = STATES.PLAYING;
                    ball.position.set(paddle.position.x, paddle.position.y + paddleSize.height, paddle.position.z);
                    let dir = new THREE.Vector3(0,-0.5,-1);
                    me.simulation.hitBall(dir, 0.02);
                    if (me.updateTouchpadMessage) me.updateTouchpadMessage();
                }
            }
        });
        this.renderer.domElement.addEventListener("mousemove", inputHandler);
        this.renderer.domElement.addEventListener("touchstart", function(ev) {
            console.log('MOBILE TOUCH: touchstart event fired, state:', state);
            
            // Handle serving on tap in touchpad area
            if (state === STATES.SERVING) {
                let isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                if (isMobile) {
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
                            let dir = new THREE.Vector3(0,-0.5,-1);
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
        setTimeout(function() {
            let audioOverlay = document.getElementById('audio-unlock-overlay');
            if (audioOverlay) {
                console.log('MOBILE FIX: Force removing stuck audio overlay');
                audioOverlay.remove();
            }
        }, 5000);
    }
    
    createTouchpadIndicator() {
        let isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
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
            
            if (PingPong.MobileDebug) {
                PingPong.MobileDebug.log('🎮 Enhanced pink touchpad indicator created');
            }
        }
    }
    
    updateTouchpadMessage() {
        let isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile && this.launchMessage) {
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
        setTimeout(function() {
            if (debugDiv.parentNode) {
                debugDiv.style.opacity = '0.3';
            }
        }, 5000);
    }
    
    createScoreboard() {
        // Create scoreboard on the back wall
        let canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        let context = canvas.getContext('2d');
        
        // Draw scoreboard background
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, 512, 128);
        
        // Draw border
        context.strokeStyle = '#ffffff';
        context.lineWidth = 4;
        context.strokeRect(2, 2, 508, 124);
        
        // Draw scores
        context.fillStyle = '#ffffff';
        context.font = 'bold 36px Arial';
        context.textAlign = 'center';
        context.fillText('PLAYER', 128, 40);
        context.fillText('AI', 384, 40);
        
        context.font = 'bold 48px Arial';
        context.fillText(playerScore.toString(), 128, 90);
        context.fillText(aiScore.toString(), 384, 90);
        
        // Create texture and material
        let texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        let material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        
        // Create mesh
        let geometry = new THREE.PlaneGeometry(2, 0.5);
        scoreboardMesh = new THREE.Mesh(geometry, material);
        // Position scoreboard on back wall, lower down, well behind AI paddle
        scoreboardMesh.position.set(0, tableSize.height * 1.8, -tableSize.depth * 0.8);
        scene.add(scoreboardMesh);
        
        if (PingPong.MobileDebug) {
            PingPong.MobileDebug.log('🏆 Scoreboard created on back wall');
        }
    }
    
    updateScoreboard() {
        if (!scoreboardMesh) return;
        
        let canvas = scoreboardMesh.material.map.image;
        let context = canvas.getContext('2d');
        
        // Clear and redraw
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, 512, 128);
        
        context.strokeStyle = '#ffffff';
        context.lineWidth = 4;
        context.strokeRect(2, 2, 508, 124);
        
        context.fillStyle = '#ffffff';
        context.font = 'bold 36px Arial';
        context.textAlign = 'center';
        context.fillText('PLAYER', 128, 40);
        context.fillText('AI', 384, 40);
        
        context.font = 'bold 48px Arial';
        context.fillText(playerScore.toString(), 128, 90);
        context.fillText(aiScore.toString(), 384, 90);
        
        scoreboardMesh.material.map.needsUpdate = true;
    }
    
    processInput(x,y) {
        let isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
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
        
        let dir = new THREE.Vector3(0,-0.5,-1);
        this.simulation.hitBall(dir, 0.02);
        
        // Reset scoring tracking for new rally
        lastHitter = 'player'; // Player served
        ballBouncedOnOpponentSide = false;
        ballHitTable = false;
        
        // Update touchpad message for new state
        this.updateTouchpadMessage();
        
    }

    toScreen(x, y, z) {
        let widthHalf = screenSize.width / 2; 
        let heightHalf = screenSize.height / 2;
        
        let projector = new THREE.Projector();
        let vector = projector.projectVector( new THREE.Vector3(x,y,z), camera );
        
        vector.x = ( vector.x * widthHalf ) + widthHalf;
        vector.y = - ( vector.y * heightHalf ) + heightHalf;
        return vector;
    }
    toWorld(x, y, zPlane) {
        let vector = new THREE.Vector3(
            (x / screenSize.width ) * 2 - 1,
            - (y / screenSize.height ) * 2 + 1,
            0.5 );
    
        projector.unprojectVector( vector, camera );
        let dir = vector.sub( camera.position ).normalize();
        zPlane = zPlane || 0;
        let distance = - (camera.position.z - zPlane) / dir.z;
        return camera.position.clone().add( dir.multiplyScalar( distance ) );
    }
    
    update() {
        if (state === STATES.LOADING) {
            return;
        }
        
        if (state === STATES.PLAYING) {
            this.ai.play();
            this.simulation.simulate();
        }
        
        //normalize input
        let px = (input.x / screenSize.width ) * 2 - 1;
        let py = - (input.y / screenSize.height ) * 2 + 1;
        
        // Raw input converted to normalized coordinates 
        
        //set camera position - AGGRESSIVE motion sickness prevention for mobile
        let isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Mobile vs desktop camera handling
        
        if (isMobile) {
            // MOBILE: Optimized camera for mobile touchpad control
            let smoothing = 0.06;    // More responsive for better control
            let deadzone = 0.1;      // Standard deadzone
            let movementScale = 0.15; // Reduced movement for stability
            
            if (Math.abs(px) > deadzone) {
                let targetCx = tableSize.width * movementScale * px;
                camera.position.x += (targetCx - camera.position.x) * smoothing;
            }
            
            // MOBILE: Fixed camera position for optimal mobile viewing
            // Position camera for clear view of table with touchpad below
            let targetCy = tableSize.height * 1.6; // Proper height for good table view
            let targetCz = tableSize.depth * 1.8;  // Further back for full table visibility
            
            camera.position.y += (targetCy - camera.position.y) * 0.12;
            camera.position.z += (targetCz - camera.position.z) * 0.12;
            
        } else {
            // DESKTOP: Normal responsive camera
            let smoothing = 0.05;
            let deadzone = 0.1;
            let movementScale = 0.2;
            
            if (Math.abs(px) > deadzone) {
                let targetCx = tableSize.width * movementScale * px;
                camera.position.x += (targetCx - camera.position.x) * smoothing;
            }
            
            let targetCy = tableSize.height * 1.4;
            let targetCz = tableSize.depth * 1.3;
            
            camera.position.y += (targetCy - camera.position.y) * 0.1;
            camera.position.z += (targetCz - camera.position.z) * 0.1;
        }
        
        // Both mobile and desktop use same smooth lookAt
        // Halfway between center and player edge center
        camera.lookAt(new THREE.Vector3(0, tableSize.height, tableSize.depth * 0.25));
        
        // Enhanced mobile debugging
        if (isMobile && PingPong.MobileDebug && this.debugFrameCount % 60 === 0) {
            PingPong.MobileDebug.log('📹 Mobile Camera: pos(' + 
                camera.position.x.toFixed(2) + ',' + 
                camera.position.y.toFixed(2) + ',' + 
                camera.position.z.toFixed(2) + ') input(' + 
                px.toFixed(2) + ',' + py.toFixed(2) + ')');
        }
        this.debugFrameCount = (this.debugFrameCount || 0) + 1;

        //camera.rotation.y = Math.PI * -0.05 * px;
        
        //Project input to table plane
        let maxpy = Math.min(0, py);
        let vector = new THREE.Vector3(px, maxpy, 0.5);
        projector.unprojectVector( vector, camera );
        let ray = new THREE.Ray( camera.position, vector.sub( camera.position ).normalize() );
        let intersect = ray.intersectPlane(inputPlane);
        
        if (!intersect) {
            intersect = paddle.position.clone();
        }
        
        // PADDLE CONSTRAINTS: Expanded movement area for better gameplay
        // Allow paddle to move beyond table bounds for more natural play
        let minZ = tableSize.depth * 0.10;  // Allow closer to net for aggressive play
        let maxZ = tableSize.depth * 0.60;  // Allow much closer to observer (+15% freedom)
        let maxX = tableSize.width * 0.50;  // Allow beyond table edges (+15% freedom)
        
        intersect.z = Math.max(minZ, Math.min(maxZ, intersect.z));
        intersect.x = Math.max(-maxX, Math.min(maxX, intersect.x));
        
        //set paddle position  
        paddle.position.x = intersect.x;
        paddle.position.z = intersect.z;
        paddle.position.y = tableSize.height;
        

        
        if (state == STATES.SERVING) {
            ball.position.set(paddle.position.x, paddle.position.y + paddleSize.height, paddle.position.z);
        }
        else {
            this.checkBallHit();
            
            // Check for ball out of bounds and scoring
            this.checkBallOutOfBounds();
        }
        
        //set paddle rotation
        let dx = Math.min(1,Math.abs(paddle.position.x/(tableSize.width*0.6)));
        let dxAI = Math.min(1,Math.abs(paddleAI.position.x/(tableSize.width*0.6)));
        
        
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
        let ballNearTable = Math.abs(ball.position.y - tableSize.height) < ballRadius * 2 && 
                           Math.abs(ball.position.x) < tableSize.width * 0.5 &&
                           Math.abs(ball.position.z) < tableSize.depth * 0.5;
                           
        if (ballNearTable && !ballHitTable) {
            ballHitTable = true;
            // Determine which side of table ball bounced on
            if (ball.position.z > 0) {
                // Ball bounced on player's side
                if (lastHitter === 'ai') {
                    ballBouncedOnOpponentSide = true;
                    if (PingPong.MobileDebug) {
                        PingPong.MobileDebug.log('🏓 Ball bounced on player side after AI hit');
                    }
                }
            } else {
                // Ball bounced on AI's side  
                if (lastHitter === 'player') {
                    ballBouncedOnOpponentSide = true;
                    if (PingPong.MobileDebug) {
                        PingPong.MobileDebug.log('🏓 Ball bounced on AI side after player hit');
                    }
                }
            }
        }
        
        // Ball too far left/right (out of bounds)
        if (Math.abs(ball.position.x) > tableSize.width * 0.6) {
            ballOutOfBounds = true;
            reasonForPoint = 'Ball went off side of table';
        }
        
        // Ball too low (fell below table)
        if (ball.position.y < tableSize.height * 0.3) {
            ballOutOfBounds = true;
            reasonForPoint = 'Ball fell below table';
        }
        
        // Ball too far on player's side (went past player)
        if (ball.position.z > tableSize.depth * 0.7) {
            ballOutOfBounds = true;
            reasonForPoint = 'Ball went past player';
        }
        
        // Ball too far on AI's side (went past AI)
        if (ball.position.z < -tableSize.depth * 0.7) {
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
                playerScore++;
                if (PingPong.MobileDebug) {
                    PingPong.MobileDebug.log('🏆 PLAYER SCORES! Reason: ' + reasonForPoint + ' | Score: ' + playerScore + '-' + aiScore);
                }
            } else if (scoreForAI) {
                aiScore++;
                if (PingPong.MobileDebug) {
                    PingPong.MobileDebug.log('🤖 AI SCORES! Reason: ' + reasonForPoint + ' | Score: ' + playerScore + '-' + aiScore);
                }
            }
            
            // Update scoreboard display
            this.updateScoreboard();
            
            // Reset for next serve
            state = STATES.SERVING;
            this.updateTouchpadMessage();
            
            // Reset ball position
            ball.position.set(0, tableSize.height * 2, tableSize.depth * 0.25);
            
            if (PingPong.MobileDebug) {
                PingPong.MobileDebug.log('🔄 Round ended, ready for new serve');
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
            hit = zDistance < tableSize.depth * 0.03 && xDistance < paddleSize.width && Math.abs(yDistance) < paddleSize.height * 0.75;
            hitting = zDistance < tableSize.depth * 0.2 && xDistance < paddleSize.width;
        }
        
        //target paddle y position
        let targetY = tableSize.height;
        if (hitting) {
            targetY = ball.position.y;
        }
        let diffY = paddle.position.y - targetY; 
        paddle.position.y+= Math.min(Math.abs(diffY), paddleSize.height* 0.1) * (diffY ? -1 : 1);
        
        if (hit) {
            let trayectory = this.calculatePaddleTrajectory();
            trayectory.z = Math.min(trayectory.z, 0);
            
            let dir = new THREE.Vector3(0,0,0);
            //fixed z
            dir.z = -1.0;
            //trayector dependant x
            let tx = trayectory.x/ (tableSize.width * 0.1);
            dir.x = 0.6 * Math.min(Math.abs(tx),1.0) * (tx > 0 ? 1 : -1);
            //trayectory dependant force and y
            let tz = trayectory.z / (tableSize.depth * 0.25);
            tz = Math.min(Math.abs(tz),1);
            let force = 0.02 + tz * 0.01;

            dir.y = 0.4;
            if (ball.position.y < tableSize.height) {
                dir.y+= 0.1;
            }
            else {
                force*=1.1;
            }
            
            dir.y-= force * 2;
            if (paddle.position.z < tableSize.depth/2) {
                dir.y-= 0.1;   
            }

    
            this.simulation.hitBall(dir, force);
            paddleTrajectory.length = 0; //clear
            
            // Track that player hit the ball for realistic scoring
            lastHitter = 'player';
            ballBouncedOnOpponentSide = false; // Reset bounce tracking
            ballHitTable = false; // Reset table hit tracking
            
            if (PingPong.MobileDebug) {
                PingPong.MobileDebug.log('🏓 PLAYER HIT BALL - lastHitter set to player');
            }
            
            // FLOOR CYCLING: Trigger floor change every 5 hits
            if (FloorCycler.enabled) FloorCycler.onHit();
        }
        
    }
    calculatePaddleTrajectory() {
        let now = Date.now();
        let trayectory = new THREE.Vector3(0,0,0);
        let prevT = null;
        for (let i = 0; i< paddleTrajectory.length; ++i) {
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
    
    render(){
        if (controls)
    	   controls.update();
        this.update();
        this.renderer.render(scene, camera);
    }
}

export default PingPong;

