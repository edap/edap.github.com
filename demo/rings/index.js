var debug = false;

//gui
var Config = function(){
    this.lightColor = '#acac0f';
    this.treeColor = '#316431';
    this.ringColor = '#ff0000';
    this.minTreshold = 0.001;
    this.decayRate = 0.2;
    this.ringNumber = 3;
    this.ringThickness = 0.02;
    this.volume = 0.6;
    this.scaleRing = 14.0;
    this.changeAutomaticallyColors = true;
};
var config = new Config();

//scenes
var scene2 = {
    //rossa
    treeColor: '#e80000',
    lightColor: '#f0f0a0',
    ringColor: '#780355',
    ringNumber: 14,
    ringThickness:0.012,
    scaleRing: 5,
    cameraPos:{x:802.134170585785, y:154.09441190059349, z:260.62919104477186}
};

var scene3 = {
    //marrone
    treeColor: '#6b3200',
    lightColor: '#ebff55',
    ringColor: '#004f7a',
    ringThickness:0.016,
    ringNumber: 10,
    scaleRing: 3,
    cameraPos:{x:-529.4349743612115, y:454.63952135910415, z:-26.009472448148284}
};

var scene1 = {
    //blu
    treeColor: '#2f51f2',
    lightColor: '#fabcf6',
    ringColor: '#a628ff',
    ringNumber: 10,
    ringThickness:0.038,
    scaleRing: 3,
    cameraPos:{x:216.3404828499118, y:425.668241185987, z:188.47662558426572}
};

var scene4 = {
    //arancio
    treeColor: '#ff8518',
    lightColor: '#96f7e6',
    ringColor: '#ff00ff',
    ringNumber: 10,
    ringThickness:0.026,
    scaleRing: 7,
    cameraPos:{x:555.4724161565803, y:120.32947789734453, z:583.4309238694725}
};

var scene5 = {
    //viola
    treeColor: '#373064',
    lightColor: '#acac0f',
    ringColor: '#ff0000',
    ringNumber: 8,
    ringThickness:0.006,
    scaleRing: 9,
    cameraPos:{x:0.0000645918674559383, y:773.7809374996122, z:0.0007722346534260191}
};

// scenography ticker
var scenography = [];
var currentScene = 0;
scenography.push(scene5, scene2, scene3, scene1, scene4);
var counter = 0;
var myClock = new maximJs.maxiClock();
var tick = 0;
myClock.setTicksPerBeat(1);// number of ticks per beat
myClock.setTempo(55);// beats Per Minute

//audio
var maxiAudio = new maximJs.maxiAudio();
var sample = new maximJs.maxiSample();
var ctx = new AudioContext();

//needed for beat detection (using rms) calculation
var threshold = 0;
var bufferCount = 0;
var bufferOut = [];
var rms = 0;
var examplesCounted = 0;

// Gereral
var container, camera, controls, scene, renderer, stats, gui, light;
var cameraZposition = 1000;

//Trees
var treeMaterial;
var loadPly = function (filename) {
    var d = $.Deferred();
    var plyLoader = new THREE.PLYLoader();
    plyLoader.load(
        filename,
        //success callback
        function (ply) {
            d.resolve(ply);
        },
        //progress callback
        function (xhr) {
            d.notify((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        //error callback
        function (error) {
            console.log('error while loading ply:' + filename);
            d.reject(error);
        }
    );
    return d.promise();
};

$.when(
        maxiAudio.loadSample('bigjoedrummer.wav', sample, ctx),
        //loadPly('tree.ply')
        loadPly('forest_simple.ply')
      ).then(
        function (_, treePly) {
            init(treePly);
            animate();
        },
        function (error) {
            console.log(error);
        }
);

function init(treePly) {
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 4000);
    camera.position.z = cameraZposition;
    controls = new THREE.OrbitControls(camera);
    controls.addEventListener('change', render);
    scene = new THREE.Scene();
    //audio
    initAudio();

    // Create Light
    light = new THREE.PointLight(config.lightColor);
    light.position.set(100, 200, 50);
    scene.add(light);

    renderer = new THREE.WebGLRenderer( { antialias: true, depth:true } );
    renderer.setClearColor( config.treeColor);
    renderer.setSize( window.innerWidth, window.innerHeight );
    //tree
    treeMaterial = createTreeMaterial();
    var trees = createTrees(treePly,treeMaterial);
    scene.add(trees);
    implementScene(scenography[0]);

    container = document.getElementById( 'spinner' ).remove();
    container = document.getElementById( 'container' );
    container.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keypress', maybeGuiPressed, false);

    addGui();
    addStats();
}

function createTrees(ofMesh, treeMaterial){
    var treesGeometry = createTreesGeometry(ofMesh);
    return new THREE.Mesh( treesGeometry, treeMaterial);
}

function createTreesGeometry(ofMesh){
    ofMesh.computeFaceNormals();
    ofMesh.computeVertexNormals();
    var treeGeometry = new THREE.BufferGeometry().fromGeometry(ofMesh);
    return treeGeometry;
}

function createTreeMaterial(){
    var screenResolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
    var tmp_uniforms = {
        uResolution:        { type: "v2", value: screenResolution },
        rms:                { type: "f", value: 0.0 },
        scaleRing:          { type: "f", value: 1.0 },
        ringNumber:         { type: "i", value: config.ringNumber },
        ringThickness:      { type: "f", value: config.ringThickness },
        ringColor:          { type: "c", value: new THREE.Color( config.ringColor ) },
        ringNumber:         { type: "f", value: config.ringNumber },
        treeColor:          { type: "c", value: new THREE.Color( config.treeColor ) },
    };

    var uniforms = THREE.UniformsUtils.merge([
        THREE.UniformsLib['lights'],
        tmp_uniforms
    ]);
    var customMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        lights: true,
        vertexShader: document.getElementById( 'vertexShaderTree' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShaderTree' ).textContent
    });
    customMaterial.side = THREE.BackSide;

    return customMaterial;
}

function initAudio(){
    maxiAudio.init();
    maxiAudio.outputIsArray(true, 2);
    var arraySize = scenography.length;
    maxiAudio.play = function(scenography) {
        myClock.ticker();
        if (myClock.tick) {
            counter++;
            if ((counter % 4) == 1 && counter !== 1) {
                maybeChangeScene();
            }
        }
        bufferCount++;
        var wave1 = sample.play();
        var mix = wave1 * config.volume; // in case you have other samples, just add them here: var mix =  wave1 +wave2;
        this.output[0] = mix;
        this.output[1] = this.output[0];
        bufferOut[bufferCount % 1024] = mix;
        var left = this.output[0];
        var right = this.output[1];
        console.log(rms);
        rms += left * left;
        rms += right * right;
        examplesCounted += 2;
    }
}

function addGui() {
    gui = new dat.GUI();
    gui.add(config, 'volume', 0.1, 3.0).step(0.2);
    gui.add(config, 'minTreshold', 0.001, 0.5).step(0.001);
    gui.add(config, 'decayRate', 0.05, 1.0).step(0.05);
    gui.add(config, 'ringThickness', 0.005, 0.05).step(0.002).onChange( onThicknessUpdate);
    gui.add(config, 'scaleRing', 1.0, 20.0).step(1.0).onChange( onScaleRingUpdate);
    gui.add(config,'ringNumber', 1, 18).step(1).name('ring number').onChange( onRingNumberUpdate );
    gui.addColor(config,'lightColor').name('light color').onChange( onLightColorUpdate );
    gui.addColor(config,'treeColor').name('tree color').onChange( onTreeColorUpdate );
    gui.addColor(config,'ringColor').name('ring color').onChange( onRingColorUpdate );
    gui.close();
    dat.GUI.toggleHide();
}

var maybeGuiPressed = function(ev) {
    if ( ev.keyCode === 103) {
        dat.GUI.toggleHide();
    }
}

var onTreeColorUpdate = function(ev) {
    treeMaterial.uniforms.treeColor.value.set(config.treeColor);
    renderer.setClearColor( config.treeColor);
};

var onRingColorUpdate = function(ev) {
    treeMaterial.uniforms.ringColor.value.set(config.ringColor);
};

var onRingNumberUpdate = function(ev) {
    treeMaterial.uniforms.ringNumber.value = config.ringNumber;
};

var onThicknessUpdate = function(ev) {
    treeMaterial.uniforms.ringThickness.value = config.ringThickness;
};

var onScaleRingUpdate = function(ev) {
    treeMaterial.uniforms.scaleRing.value = config.scaleRing;
};

var onLightColorUpdate = function(ev) {
    light.color.set(config.lightColor);
};

function addStats() {
    stats = new Stats();
    stats.showPanel(0);
    if (debug) {
        container.appendChild(stats.domElement);
    }
}

function onWindowResize() {
    //you have also to update the uniforms of the screen resolution
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    render();
}

function animate() {
    treeMaterial.uniforms.ringColor.needsUpdate = true;
    treeMaterial.uniforms.treeColor.needsUpdate = true;
    treeMaterial.uniforms.ringThickness.needsUpdate = true;
    treeMaterial.uniforms.ringNumber.needsUpdate = true;
    treeMaterial.uniforms.rms.needsUpdate = true;
    treeMaterial.uniforms.scaleRing.needsUpdate = true;
    requestAnimationFrame( animate );
    render();
    calcRms(bufferOut);
    if (debug) {
        stats.update();
    }
}

function calcRms(bufferOut) {
    if (bufferOut.length === 1024) {
        rms /= examplesCounted;
        rms = Math.sqrt(rms);

        threshold = lerp(threshold, this.config.minTreshold, this.config.decayRate);
        if (rms > threshold) {
            threshold = rms;
        }
        treeMaterial.uniforms.rms.value = threshold;
    }
}

function maybeChangeScene(){
    //console.log("{x:"+camera.position.x+", y:"+camera.position.y+", z:"+camera.position.z+"}");
    if (!this.config.changeAutomaticallyColors) return;
    currentScene += 1;
    if (currentScene == scenography.length) {
        currentScene = 0;
    }

    var scene = scenography[currentScene];
    implementScene(scene)
}

function implementScene(scene){
    renderer.setClearColor(scene.treeColor);
    light.color.set(scene.lightColor);
    this.treeMaterial.uniforms.ringColor.value.set(scene.ringColor);
    this.treeMaterial.uniforms.treeColor.value.set(scene.treeColor);
    this.treeMaterial.uniforms.ringNumber.value = scene.ringNumber;
    this.treeMaterial.uniforms.ringThickness.value = scene.ringThickness;
    this.treeMaterial.uniforms.scaleRing.value = scene.scaleRing;
    moveCamera(scene.cameraPos);
}

function render() {
    camera.lookAt(scene.position);
    renderer.render( scene, camera );
}

function moveCamera(camPos) {
    camera.position.set(camPos.x, camPos.y, camPos.z);
}

function lerp(start, end, pos){
    return start + (end - start) * pos;
}
