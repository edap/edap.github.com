var debug = false;
var Config = function(){
    this.lightColor = '#acac0f';
    this.treeColor = '#316431';
    this.ringColor = '#ff0000';
    this.minTreshold = 0.001;
    this.decayRate = 0.6;
    this.ringNumber = 3;
    this.ringThickness = 0.02;
    this.volume = 0.5;
    this.scaleRing = 1.0;
};

var clock = new THREE.Clock(1);

var maxiAudio = new maximJs.maxiAudio();
var sample = new maximJs.maxiSample();
var ctx = new AudioContext();

//needed for rms calculation
var threshold = 0;
var bufferCount = 0;
var bufferOut = [];
var rms = 0;
var examplesCounted = 0;

var cameraZposition = 1000;

// Gereral
var container, camera, controls, scene, renderer, stats, gui, light;
var config = new Config();

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
        maxiAudio.loadSample('beat.wav', sample, ctx),
        loadPly('tree.ply')
        //loadPly('forest_simple.ply')
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
    maxiAudio.play = function() {
        bufferCount++;
        var wave1 = sample.play();
        var mix = wave1 * config.volume; // in case you have other samples, just add them here: var mix =  wave1 +wave2;
        this.output[0] = mix;
        this.output[1] = this.output[0];
        bufferOut[bufferCount % 1024] = mix;
        var left = this.output[0];
        var right = this.output[1];
        rms += left * left;
        rms += right * right;
        examplesCounted += 2;
    }
}

function addGui() {
    if (debug) {
        gui = new dat.GUI();
        gui.add(config, 'volume', 0.1, 3.0).step(0.2);
        gui.add(config, 'minTreshold', 0.001, 0.5).step(0.001);
        gui.add(config, 'decayRate', 0.05, 1.0).step(0.05);
        gui.add(config, 'ringThickness', 0.005, 0.05).step(0.002).onChange( onThicknessUpdate);
        gui.add(config, 'scaleRing', 0.5, 3.0).step(0.4).onChange( onScaleRingUpdate);
        gui.add(config,'ringNumber', 1, 18).step(1).name('ring number').onChange( onRingNumberUpdate );
        gui.addColor(config,'lightColor').name('light color').onChange( onLightColorUpdate );
        gui.addColor(config,'treeColor').name('tree color').onChange( onTreeColorUpdate );
        gui.addColor(config,'ringColor').name('ring color').onChange( onRingColorUpdate );
        gui.close();
    }
}

var maybeGuiPressed = function(ev) {
    console.log(ev.keyCode);
    if ( ev === 103) {
        debug = !debug;
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
    stats.update();
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

function render() {
    //moveCamera();
    renderer.render( scene, camera );
}

function moveCamera() {
    camera.position.set(camPos.x, yPos, camPos.z);
}

function lerp(start, end, pos){
    return start + (end - start) * pos;
}
