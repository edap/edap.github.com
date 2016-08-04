var debug = true;

//gui
var Config = function(){
    this.minTreshold = 0.001;
    this.decayRate = 0.2;
    this.volume = 0.6;
};
var config = new Config();

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

$.when(
        maxiAudio.loadSample('bigjoedrummer.wav', sample, ctx),
      ).then(
        function () {
            init();
            animate();
        },
        function (error) {
            console.log(error);
        }
);

function init() {
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
    container = document.getElementById( 'spinner' ).remove();
    container = document.getElementById( 'container' );
    container.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keypress', maybeGuiPressed, false);

    addGui();
    addStats();
}

function initAudio(){
    maxiAudio.init();
    maxiAudio.outputIsArray(true, 2);
    var arraySize = scenography.length;
    maxiAudio.play = function(scenography) {
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
    gui = new dat.GUI();
    gui.add(config, 'volume', 0.1, 3.0).step(0.2);
    gui.add(config, 'minTreshold', 0.001, 0.5).step(0.001);
    gui.add(config, 'decayRate', 0.05, 1.0).step(0.05);
    gui.close();
    dat.GUI.toggleHide();
}

var maybeGuiPressed = function(ev) {
    if ( ev.keyCode === 103) {
        dat.GUI.toggleHide();
    }
}

var onScaleRingUpdate = function(ev) {
    treeMaterial.uniforms.scaleRing.value = config.scaleRing;
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
    }
}

function render() {
    renderer.render( scene, camera );
}
