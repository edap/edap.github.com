var debug = true;

//gui
var Config = function(){
    this.minTreshold = 0.000000000000000001;
    this.decayRate = 0.5;
    this.volume = 0.6;
    this.magMult = 1000.0;
};
var config = new Config();

//audio
var maxiAudio = new maximJs.maxiAudio();
var fftSize = 512;
var windowSize = 512;
var hopSize = 256;
var fft = new maximJs.maxiFFT();
var sample = new maximJs.maxiSample();
var ctx = new AudioContext();
var spectralFlux;
//use to calculate the overall magnitude for each bin

//needed for beat detection (using rms) calculation
var threshold;
var bufferCount = 0;
var bufferOut = [];
var rms = 0;
var examplesCounted = 0;

// Gereral
var container, camera, controls, scene, renderer, stats, gui, light;
var cameraZposition = 1000;
var bars = [];
var barsSize = fftSize/2; // fft contains info about left and right channel, i want to visualize the bot merged

$.when(
        //maxiAudio.loadSample('Met_Met_-_10_-_Ora_I_i_o.mp3', sample, ctx)
        maxiAudio.loadSample('small.wav', sample, ctx)
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
    spectralFlux = initArrayWithZeroValues(fftSize);
    threshold = initArrayWithZeroValues(fftSize);
    initAudio();
    initBars();

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

function initBars(){
    for(i = 0; i < fftSize; i++){
        var y = Math.random(500);
        var geometry = new THREE.BoxBufferGeometry( 1, y, 1 );
        var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        var cube = new THREE.Mesh( geometry, material );
        cube.position.setX(i);
        bars.push(cube);
        scene.add(bars[i]);
    }
}

function initAudio(){
    maxiAudio.init();
    fft.setup(fftSize, windowSize, hopSize);
    maxiAudio.play = function() {
        var wave1 = sample.play();
        var mix = wave1 * config.volume; // in case you have other samples, just add them here: var mix =  wave1 +wave2;
        this.output = mix;
        if (fft.process(mix)) {
            fft.magsToDB();
        }
        bufferCount++;
        bufferOut[bufferCount % 1024] = mix;
        examplesCounted += 2;
    }
}

function addGui() {
    gui = new dat.GUI();
    gui.add(config, 'volume', 0.1, 3.0).step(0.2);
    gui.add(config, 'magMult', 0.5, 4.0).step(0.5);
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

function initArrayWithZeroValues(size){
    zeroed = [];
    for (i = 0; i< fftSize; i++) {
        zeroed[i] = 0;
    }
    return zeroed;
}

function onsetDetection(){
    var flux = 0;
    for (i = 0; i< fftSize; i++) {
       lastSpectrum[i] = spectrum[i]
       spectrum[i] = fft.getMagnitude(i);

       var value = (spectrum[i] - lastSpectrum[i]);
       flux += (value < 0 ? 0 : value);
       spectralFlux[i] = flux;
    }

}

function updateBars(){
    // fft contains 512 samples (set in fftSize)
    // the first 256 samples are for the left channel
    // the other 256 for the right channel
    // I sum the fft magnitude of the 2 channels
    for(i = 0; i< barsSize; i++){
        //i save the previous spectrum values
        var left = i;
        var right = barsSize + i;
        var fftMag = spectralFlux[left] + spectralFlux[right];
        bars[i].position.setY(fftMag * config.magMult);
    }
}

function animate() {
    requestAnimationFrame( animate );
    onsetDetection();
    updateBars();
    render();
    if (debug) {
        stats.update();
    }
}

function populateSpectralFlux(){
    for (i = 0; i< fftSize; i++) {
       spectralFlux[i] += fft.getMagnitude(i);
    }
}

function updateBars(){
    // the barSize value has to be tha same as in the spectralflux
    // fft contains 512 samples (set in fftSize)
    // the first 256 samples are for the left channel
    // the other 256 for the right channel
    // I sum the fft magnitude of the 2 channels
    //for(i = 0; i< barsSize; i++){
    for(i = 0; i < fftSize; i++){
        //i save the previous spectrum values
        // var left = i;
        // var right = barsSize + i;
        // var fftMag = spectralFlux[left] + spectralFlux[right];

        spectralFlux[i] /= examplesCounted;
        spectralFlux[i] = Math.sqrt(spectralFlux[i]);

        threshold[i] = lerp(threshold[i], this.config.minTreshold, this.config.decayRate);
        if (spectralFlux[i]  > threshold[i]) {
            threshold[i] = spectralFlux[i];
        }

        bars[i].position.setY(threshold[i] * config.magMult);
    }
}

function animate() {
    requestAnimationFrame( animate );
    //onsetDetection();

    if (bufferOut.length === 1024) {
        populateSpectralFlux();
        updateBars();
    }
    render();
    if (debug) {
        stats.update();
    }
}

function render() {
    renderer.render( scene, camera );
}

function lerp(start, end, pos){
    return start + (end - start) * pos;
}
