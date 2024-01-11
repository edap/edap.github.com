var controls;
var container;
var camera, scene, renderer, targetCamera, gui;
var plane;
var delta;
var time;
var oldTime;
var uniforms;
var n_planes = 250;
var raySpheroDome = 400;
var light;
var grassMaterial;

var debug = true;
var camY = 50;
var camZ = -200;
var lightPos = new THREE.Vector3(0,100, raySpheroDome - 90);

//gui
var Config = function(){
    this.lightColor = '#872b17';
    this.lightPower = 0.2;
    this.ambientLightPower = 0.15;
    this.magnitude = 0.6;
};
var config = new Config();

$.when(
    loadTexture('images/portugal-seamless-gold.jpg'),
    //loadTexture('images/thingrass-gold.jpg'),
    //loadTexture('images/thingrass-gold2.jpg'),
    loadTexture('images/thingrass-gold3.jpg'),
    loadTexture('images/ground-diffuse.jpg')
).then(
    function(bg, grass, ground) {
        init(bg, grass, ground);
        animate();
    },
    function(error) {
        console.log(error);
    }
);

function init(bgTex, grassTex, groundTex) {
    var bgTexture = bgTex;
    var grassTexture = grassTex;
    var groundTexture = groundTex;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = camZ;
    camera.position.y = camY;

    targetCamera = new THREE.Vector3().clone(scene.position);
    camera.lookAt(targetCamera);

    // uncomment this part to see the sun
    //var geometry = new THREE.SphereBufferGeometry( 50, 32, 32 );
    //geometry.applyMatrix( new THREE.Matrix4().setPosition(lightPos) );
    //var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
    //var sphere = new THREE.Mesh( geometry, material );
    // scene.add( sphere );
    // Create Light

    controls = new THREE.OrbitControls(camera);
    controls.addEventListener('change', render);
    controls.enableZoom = false;
    controls.enablePan = false;
    setOrbitControlsLimits(controls);

    targetCamera = new THREE.Vector3().clone(scene.position);
    camera.lookAt(targetCamera);
    scene.add( camera );

    renderer = new THREE.WebGLRenderer({antialias: false});
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0xb04130, 1 );

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keypress', maybeGuiPressed, false);

    //SPHEREDOME
    var sphereWidth = 400;
    var bgGeometry = new THREE.SphereBufferGeometry(raySpheroDome, 12, 12, 0, Math.PI*2, 0, Math.PI*0.5);
    var bgMaterial = new THREE.MeshBasicMaterial(
        {color: 0x999999, map: bgTexture, fog: false, side: THREE.BackSide});
    bgGeometry.applyMatrix( new THREE.Matrix4().makeRotationY(-Math.PI-1.25));
    var sky = new THREE.Mesh(bgGeometry, bgMaterial);
    sky.position.set(0, -50, 0);
    sky.rotation.y = Math.PI;
    sky.matrixAutoUpdate = false;
    sky.updateMatrix();
    scene.add(sky);

    //GRASS
    //materiale di test
    uniforms = setUniforms(grassTexture);
    grassMaterial = getGrassShaderMaterial(uniforms);
    var delMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
    var planesGeometry = createPlanesGeometry(350);
    planesGeometry.applyMatrix( new THREE.Matrix4().setPosition( new THREE.Vector3( 0, 0, -200 ) ) );
    var planes = new THREE.Mesh(planesGeometry, grassMaterial);
    planes.position.set(0, 200, 0);
    planes.matrixAutoUpdate = false;
    scene.add(planes);

    //GROUND
    var groundGeometry = new THREE.PlaneBufferGeometry(3000,3000);
    var groundMaterial = new THREE.MeshBasicMaterial(
                                        {color: 0x333333, map: groundTexture });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.material.map.wrapS = ground.material.map.wrapT = THREE.RepeatWrapping;
    ground.material.map.repeat.x = ground.material.map.repeat.y = 100;
    ground.rotation.y = -Math.PI;
    ground.rotation.x = Math.PI/2;
    ground.matrixAutoUpdate = false;
    ground.updateMatrix();
    scene.add(ground);

    container = document.getElementById( 'container' );
    container.appendChild(renderer.domElement);
    container.appendChild( renderer.domElement );
    addGui();
    if (debug) {
        addStats();
    }
}

function animate() {
    grassMaterial.uniforms.lightColor.needsUpdate = true;
    requestAnimationFrame( animate );
    render();
    if (debug) {
        stats.update();
    }
}

function render() {
    time = new Date().getTime();
    delta = time - oldTime;
    oldTime = time;

    if (isNaN(delta) || delta > 1000 || delta == 0 ) {
        delta = 1000/60;
    }

    if (uniforms) {
        uniforms.globalTime.value += delta * 0.0012;
    }
    renderer.render( scene, camera );
}

function createPlanesGeometry(n_planes){
    var containerGeometry = new THREE.Geometry();
    var planeGeometry = new THREE.PlaneGeometry(400, 30, 14, 1);
    for (var i = 0; i < planeGeometry.vertices.length; i++) {
        planeGeometry.vertices[i].z = Math.sin(planeGeometry.vertices[i].x)*20;
    };
    planeGeometry.applyMatrix( new THREE.Matrix4().setPosition( new THREE.Vector3( 0, 15, 0 ) ) );
    var x = 0;
    var z = 0;
    var rot = (Math.PI*2)/3;

    var mesh = new THREE.Mesh(planeGeometry);

    for (var i = 0; i < n_planes; i++) {
        mesh.rotation.y = (i%3 * rot) + Math.random()-0.5;
        mesh.position.set(x*50 -250 , 0, z*80 -180 );
        mesh.position.x += Math.random()*20 - 10;
        mesh.position.z += Math.random()*20 - 10;
        mesh.scale.y = 1.1-Math.random()*0.4;

        if (i%3 == 2) {
            ++x;
        }
        if (x == 11) {
            x = 0;
            ++z;
        }
        mesh.updateMatrix();
        containerGeometry.merge(mesh.geometry, mesh.matrix);
    };
    // I've used a BufferGeometry only here, and not previously, because buffered geometries
    // do not work with the merge method
    var bufferedGeometry = new THREE.BufferGeometry().fromGeometry(containerGeometry);
    return bufferedGeometry;
}

function setUniforms(texture){
    texture.wrapS = THREE.RepeatWrapping;
    var maxAnisotropy = renderer.getMaxAnisotropy();
    texture.anisotropy = maxAnisotropy;
    var unif = {
        lightPos:   { type: "v3", value: lightPos },
        lightColor: { type: "c", value: new THREE.Color(config.lightColor) },
        magnitude:  { type: "f", value: config.magnitude },
        lightPower: { type: "f", value: config.lightPower },
        ambientLightPower: { type: "f", value: config.ambientLightPower },
        texture:    { type: "t", value: texture },
        globalTime: { type: "f", value: 0.0 },
        uvScale:    { type: "v2", value: new THREE.Vector2( 16.0, 1.0 ) }
    };
    return unif;
}

function getGrassShaderMaterial(uniforms){
    var material = new THREE.ShaderMaterial( {
        uniforms:       uniforms,
        vertexShader:   document.getElementById( 'vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
        wireframe:      false,
        side:           THREE.DoubleSide
    });
    return material;
}

function loadTexture(filename){
    var d = $.Deferred();
    var textureLoader = new THREE.TextureLoader();
    textureLoader.load(
        filename,
        //success callback
        function (texture) {
            d.resolve(texture);
        },
        //progress callback
        function (xhr) {
            d.notify((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        //error callback
        function (error) {
            console.log('error while loading texture: ' + filename);
            d.reject(error);
        }

    );
    return d.promise();
};

function addGui() {
    gui = new dat.GUI();
    gui.add(config, 'magnitude', 0.1, 13.0).step(0.1).onChange( onMagnitudeUpdate );
    gui.add(config, 'lightPower', 0.02, 2.0).step(0.02).onChange( onLightPowerUpdate );
    gui.add(config, 'ambientLightPower', 0.0, 1.0).step(0.05).onChange( onAmbientLightPowerUpdate );
    gui.addColor(config, 'lightColor').name('light color').onChange( onLightColorUpdate );
    gui.open();
    if(debug == false){
        dat.GUI.toggleHide();
    }

}

function addStats() {
    stats = new Stats();
    stats.showPanel(0);
    if (debug) {
        container.appendChild(stats.domElement);
    }
}


var maybeGuiPressed = function(ev) {
    console.log(ev.keyCode);
    if ( ev.keyCode === 103) {
        dat.GUI.toggleHide();
    }
};

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    render();
}

var onMagnitudeUpdate = function(ev) {
    grassMaterial.uniforms.magnitude.value = config.magnitude;
};

var onLightPowerUpdate = function(ev) {
    grassMaterial.uniforms.lightPower.value = config.lightPower;
};

var onAmbientLightPowerUpdate = function(ev) {
    grassMaterial.uniforms.ambientLightPower.value = config.ambientLightPower;
};

var onLightColorUpdate = function(ev) {
    light.color.set(config.lightColor);
    grassMaterial.uniforms.lightColor.value.set(config.lightColor);
};

function setOrbitControlsLimits(controls){
    controls.minPolarAngle = 1.2; // radians
    controls.maxPolarAngle = Math.PI/2.1; // radians
    //controls.minDistance = 5;
    //controls.maxDistance = 14;
}


