var Config = function(){
    this.lightColor = '#acac0f';
    this.treeColor = '#824938';
    this.ringThickness = 0.2;
};

var clock = new THREE.Clock(1);

var cameraZposition = 1000;

var bumpScale = 200; // how much tha bumb affects the heights
// Gereral
var container, camera, controls, scene, renderer, stats, gui, light;
var config = new Config();
var debug = true;

// Background

//Trees
var treeMaterial;

// Loaders Promises
var loadAudio = function (filename) {
    var d = $.Deferred();
    var audioLoader = new THREE.AudioLoader();
    audioLoader.load(
        filename,
        //success callback
        function (audioBuffer) {
            d.resolve(audioBuffer);
        },
        //progress callback
        function (xhr) {
            d.notify((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        //error callback
        function (error) {
            console.log('error while loading audio: ' + filename);
            d.reject(error);
        }
    );
    return d.promise();
};

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
        //loadAudio('beat.wav'),
        loadPly('tree.ply')
      ).then(
        function (treePly) {
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
    scene.fog = new THREE.FogExp2( 0x824938, 0.008 );
    //audio
    // initAudio();
    // scene.add( barkingDogSound );
    // barkingDogSound.setBuffer(audioBuffer);
    // Create Light
    light = new THREE.PointLight(config.lightColor);
    light.position.set(100, 200, 50);
    scene.add(light);

    renderer = new THREE.WebGLRenderer( { antialias: true, depth:true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    //tree
    treeMaterial = createTreeMaterial(scene.fog);
    var trees = createTrees(treePly,treeMaterial);

    var forestBoundingBox = getForestBoundingBox(trees);
    treeMaterial.uniforms.forestDimensionMin.needsUpdate = true;
    treeMaterial.uniforms.forestDimensionMax.needsUpdate = true;
    treeMaterial.uniforms.forestDimensionMin.value.setX(forestBoundingBox.min.x);
    treeMaterial.uniforms.forestDimensionMin.value.setY(forestBoundingBox.min.y);
    treeMaterial.uniforms.forestDimensionMax.value.setX(forestBoundingBox.max.x);
    treeMaterial.uniforms.forestDimensionMax.value.setY(forestBoundingBox.max.y);
    treeMaterial.uniforms.forestDimensionMin.needsUpdate = false;
    treeMaterial.uniforms.forestDimensionMax.needsUpdate = false;

    treeMaterial.uniforms.forestResolution.needsUpdate = true;
    treeMaterial.uniforms.forestResolution.value.setX(
        Math.abs(forestBoundingBox.min.x) + forestBoundingBox.max.x);
    treeMaterial.uniforms.forestResolution.value.setY(
        Math.abs(forestBoundingBox.min.y) + forestBoundingBox.max.y);
    treeMaterial.uniforms.forestResolution.needsUpdate = false;



    scene.add(trees);

    container = document.getElementById( 'spinner' ).remove();
    container = document.getElementById( 'container' );
    container.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize, false);

    addGui();
    addStats();
}

function getForestBoundingBox(mesh){
    var boundingBox = new THREE.Box3().setFromObject( mesh );
    return boundingBox;
}

function createTrees(ofMesh, treeMaterial){
    var treesGeometry = createTreesGeometry(ofMesh);
    return new THREE.Mesh( treesGeometry, treeMaterial);
}

function createTreesGeometry(ofMesh){
    var density = 1; // n trees pro point in curve

    ofMesh.computeFaceNormals();
    ofMesh.computeVertexNormals();
    var treeGeometry = new THREE.BufferGeometry().fromGeometry(ofMesh);
    return treeGeometry;
}

function createTreeMaterial(fog, forestDimension){
    var tmpDim = new THREE.Vector2(0,0);
    var tmp_uniforms = {
        time:               { type: "f", value: clock.getDelta() },
        forestDimensionMin: { type: "v2", value: tmpDim },
        forestDimensionMax: { type: "v2", value: tmpDim },
        forestResolution:   { type: "v2", value: tmpDim },
        amplitude:          { type: "f", value: 1.0 },
        ringThickness:      { type: "f", value: config.ringThickness },
        bumpScale:          { type: "f", value: bumpScale },
        fogDensity:         { type: "f", value: fog.density },
        fogColor:           { type: "c", value: fog.color },
        color:              { type: "c", value: new THREE.Color( config.treeColor ) },
    };

    var uniforms = THREE.UniformsUtils.merge([
        THREE.UniformsLib['lights'],
        tmp_uniforms
    ]);
    var customMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        fog: false,
        lights: true,
        vertexShader: document.getElementById( 'vertexShaderTree' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShaderTree' ).textContent
    });
    customMaterial.side = THREE.BackSide;

    return customMaterial;
}

// function initAudio(){
//     var audioListener = new THREE.AudioListener();
//     camera.add( audioListener );
//     barkingDogSound = new THREE.Audio( audioListener );
//     barkingDogSound.setLoop(true);
// }

function addGui() {
    if (debug) {
        gui = new dat.GUI();
        gui.add(treeMaterial.uniforms.bumpScale, 'value')
            .name('bumpScale').min(20).max(300).step(1.0);
        gui.add(config, 'ringThickness', 0.02, 0.5).step(0.05).onChange( onThicknessUpdate);
        gui.addColor(config,'lightColor').name('light color').onChange( onLightColorUpdate );
        gui.addColor(config,'treeColor').name('tree color').onChange( onTreeColorUpdate );
        gui.close();
    }
}

var onTreeColorUpdate = function(ev) {
    treeMaterial.uniforms.color.value.set(config.treeColor);
};

var onThicknessUpdate = function(ev) {
    treeMaterial.uniforms.ringThickness.value = config.ringThickness;
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
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    render();
}

function animate() {
    treeMaterial.uniforms.color.needsUpdate = true;
    treeMaterial.uniforms.time.needsUpdate = true;
    treeMaterial.uniforms.ringThickness.needsUpdate = true;
    requestAnimationFrame( animate );
    render();
    stats.update();
}

function render() {
    //moveCamera();
    renderer.render( scene, camera );
    treeMaterial.uniforms.time.value = clock.getElapsedTime() * 5;
}

function moveCamera() {
    camera.position.set(camPos.x, yPos, camPos.z);
}
