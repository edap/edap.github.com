// Gereral
var container, camera, controls, scene, renderer, stats, gui;

// Terrain
var bumpScale = 200; // how much tha bumb affects the heights
var side = 2000; // side of the plane
var terrain; // Plane geometry
var planeRotation = Math.PI/2;

// Background
var backgroundScene, backgroundCamera, backgroundMesh;

//Path and camera
var pathGeometry; // path geometry
var spline; // Catmull-Rom spline, used for the camera
var t = 0; // value used to calculate the position of the camera along tha path
var cameraSpeed = 0.00005;
var jumpFactor = 0.009; // how often is the camera jumping
var cameraZposition = 2000;
var curveDensity = 600; // how many points define the path
var cameraHeight = 15; // how high is the camera on the y axis

//Sound
var barkingDog = false;
var barkingDogSound;

//Trees
var maxDistanceFromPath = 200; // how much the position of a tree can be different from the point on the path

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

var loadSvg = function (filename) {
    var d = $.Deferred();
    var svgLoader = new THREE.SVGLoader();
    svgLoader.load(
        filename,
        //success callback
        function (svg) {
            d.resolve(svg);
        },
        //progress callback
        function (xhr) {
            d.notify((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        //error callback
        function (error) {
            console.log('error while loading svg:' + filename);
            d.reject(error);
        }
    );
    return d.promise();
};

var loadTexture = function (filename){
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

$.when( loadSvg('path.svg'),
        loadTexture('terrain512.png'),
        // street with grass
        //loadTexture('grass512.jpg'),
        //violet street
        loadTexture('grass-violet512.jpg'),
        //street with stone
        //loadTexture('desertrock-dark512.jpg'),

        loadTexture('rock-top512.jpg'),
        //loadTexture('desertrock-dark512.jpg'),
        //loadTexture('rock-dark512.jpg'),
        loadTexture('desertrock-light512.jpg'),
        loadTexture('bg.jpg'),
        loadAudio('dog.mp3'),
        loadPly('triangles11.ply')
      ).then(
        function (svg, texture, grass, rockTop, rockBottom, backgroundTexture, audioBuffer, treePly) {
            init(svg, texture, grass, rockTop, rockBottom, backgroundTexture, audioBuffer, treePly);
            terrain.visible = true;
            animate();
        },
        function (error) {
            console.log(error);
        }
);

function init(svgPath, bumpTexture, grassTexture, rockTopTexture, rockBottomTexture, backgroundTexture, audioBuffer, treePly) {
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 4000);
    camera.position.z = cameraZposition;
    controls = new THREE.OrbitControls(camera);
    controls.addEventListener('change', render);
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0x000000, 0.004 );
    //audio
    initAudio();
    scene.add( barkingDogSound );
    barkingDogSound.setBuffer(audioBuffer);

    //background
    var skyDome = createSkyDome(backgroundTexture);
    scene.add(skyDome);

    // Create Light
    var light = new THREE.PointLight(0xFFFFFF);
    light.position.set(0, 0, 500);
    scene.add(light);

    renderer = new THREE.WebGLRenderer( { antialias: true, depth:true} );
    renderer.setSize( window.innerWidth, window.innerHeight );

    //container DOM
    container = document.getElementById( 'container' );
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    //terrain
    var customMaterial = createCustomMaterial(bumpTexture, grassTexture, rockBottomTexture, rockTopTexture);
    var geometryPlane = new THREE.PlaneBufferGeometry(side, side, 50, 50);
    geometryPlane.rotateX( - planeRotation);
    terrain = new THREE.Mesh(geometryPlane, customMaterial);
    scene.add(terrain);

    //path
    var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
    var splineVertices = readVerticesInSvg(svgPath);
    spline = createCurveFromVertices(splineVertices);
    pathGeometry = createSplineGeometry(spline);
    var splineObject = new THREE.Line(pathGeometry, material);
    scene.add(splineObject);

    //tree
    var trees = createTrees(treePly,scene.fog);
    for(var n = 0; n < trees.length; n++){
        scene.add(trees[n]);
    }
    //scene.add(trees);

    addGui(customMaterial);
    document.body.addEventListener("keypress", maybeSpacebarPressed);
    addStats();
}

function createTrees(ofMesh, fog){
    var treeMaterial = createTreeMaterial(fog);
    ofMesh.computeFaceNormals();
    ofMesh.computeVertexNormals();
    var treeGeometry = new THREE.BufferGeometry().fromGeometry(ofMesh);

    //displacement
    displacement = new Float32Array( treeGeometry.attributes.position.count );
    noise = new Float32Array( treeGeometry.attributes.position.count );
    for ( var i = 0; i < displacement.length; i ++ ) {
        noise[ i ] = Math.random() * 5;
    }
    treeGeometry.addAttribute( 'displacement', new THREE.BufferAttribute( displacement, 1 ) );
    //fine displacement
    var trees = [];
    for (var i = 0; i< spline.points.length; i++) {
        if(i%3 === 0){
            var tree = new THREE.Mesh( treeGeometry, treeMaterial );
            var pos = spline.points[i];
            tree.position.z = pos.z+ getRandomArbitrary(-maxDistanceFromPath, +maxDistanceFromPath);
            tree.position.x = pos.x + getRandomArbitrary(-maxDistanceFromPath, +maxDistanceFromPath);
            tree.position.y = pos.y - cameraHeight;
            tree.rotation.y = Math.PI / getRandomArbitrary(-3, 3);
            tree.scale.multiplyScalar( 0.1 );
            trees.push(tree);
        }

    }
    return trees;
}

function createTreeMaterial(fog){
    var tmp_uniforms = {
        amplitude:  { type: "f", value: 1.0 },
        fogDensity: { type: "f", value: fog.density},
        fogColor:   { type: "c", value: fog.color},
        color:      { type: "c", value: new THREE.Color( 0xff2200 ) },
    };

    var uniforms = THREE.UniformsUtils.merge([
        THREE.UniformsLib['lights'],
        tmp_uniforms
    ]);
    var customMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        fog: true,
        lights: true,
        vertexShader: document.getElementById( 'vertexShaderTree' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShaderTree' ).textContent
    });
    customMaterial.side = THREE.BackSide;
    return customMaterial;
}

function maybeSpacebarPressed(e){
    if (e.keyCode === 0 || e.keyCode === 32) {
        e.preventDefault();
        barkingDog = !barkingDog;
        if (barkingDog) {
            cameraSpeed = 0.0003;
            jumpFactor = 0.02;
            barkingDogSound.play();
        } else {
            cameraSpeed = 0.0001;
            jumpFactor = 0.009;
            barkingDogSound.stop();
        }
    }
}

function createSkyDome(backgroundTexture){
    var geometry = new THREE.SphereGeometry(3000, 60, 40);
    var uniforms = {
      texture: { type: 't', value: backgroundTexture }
    };

    var material = new THREE.ShaderMaterial( {
      uniforms:       uniforms,
      vertexShader:   document.getElementById('sky-vertex').textContent,
      fragmentShader: document.getElementById('sky-fragment').textContent
    });

    skyDome = new THREE.Mesh(geometry, material);
    skyDome.scale.set(-1, 1, 1);
    skyDome.rotation.order = 'XZY';
    skyDome.renderDepth = 1000.0;
    return skyDome;
}

function initAudio(){
    var audioListener = new THREE.AudioListener();
    camera.add( audioListener );
    barkingDogSound = new THREE.Audio( audioListener );
    barkingDogSound.setLoop(true);
}

function initBackground(backgroundTexture) {
    var backgroundMesh = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(2, 2, 0),
        new THREE.MeshBasicMaterial({
            map: backgroundTexture
        }));
    backgroundMesh.material.depthTest = false;
    backgroundMesh.material.depthWrite = false;

    backgroundScene = new THREE.Scene();
    backgroundCamera = new THREE.Camera();
    backgroundScene.add(backgroundCamera );
    backgroundScene.add(backgroundMesh );
}

function createCustomMaterial(bumpTexture, grassTexture, rockBottomTexture, rockTopTexture) {
    bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping;
    rockBottomTexture.wrapS = rockBottomTexture.wrapT = THREE.RepeatWrapping;
    rockTopTexture.wrapS = rockTopTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;

    var myUniforms = {
        bumpScale:         {type: 'f', value: bumpScale},
        bumpTexture:       {type: 't', value: bumpTexture},
        grassTexture:      {type: 't', value: grassTexture},
        rockTopTexture:    {type: 't', value: rockTopTexture},
        rockBottomTexture: {type: 't', value: rockBottomTexture}
    };

    var customMaterial = new THREE.ShaderMaterial({
        uniforms: myUniforms,
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent,
    });

    return customMaterial;
}

function createSplineGeometry(curve) {
    var geometry = new THREE.Geometry();
    geometry.vertices = curve.getPoints( curveDensity );
    return geometry;
}

function addGui(customMaterial) {
    gui = new dat.GUI();
    gui.add(customMaterial.uniforms.bumpScale, 'value')
        .name('bumpScale').min(20).max(300).step(1.0);
    gui.close();
}

function addStats() {
    stats = new Stats();
    stats.showPanel(0);
    container.appendChild(stats.domElement);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    render();
}

function animate() {
    requestAnimationFrame( animate );
    render();
    stats.update();
}

function render() {
    moveCamera();
    renderer.render( scene, camera );
}

function moveCamera() {
    var camPos = spline.getPointAt(t);
    //var sinYpos = Math.sin(new Date().getTime() * jumpFactor) * cameraHeight;
    var sinYpos = cameraHeight;
    var yPos = sinYpos.map(-cameraHeight, cameraHeight, cameraHeight, (cameraHeight * 1.5));
    camera.position.set(camPos.x, yPos, camPos.z);
    // no need to rotate beacuse the path is always on y = 0
    // if in the future you will have a path that goes up and down
    // use the rotation too
    // var camRot = spline.getTangent(t);
    // camera.rotation.set(camRot.x,camRot.y,camRot.z);
    // even better, using quaternions
    // http://stackoverflow.com/questions/18400667/three-js-object-following-a-spline-path-rotation-tanget-issues-constant-sp
    // http://stackoverflow.com/questions/11179327/orient-objects-rotation-to-a-spline-point-tangent-in-three-js
    var look = spline.getPointAt(t + cameraSpeed * 20);
    // the lookAt position is just 20 points ahead the current position
    look.y = yPos;
    camera.lookAt(look);
    t = (t >= 0.99) ? 0 : t += cameraSpeed;
}

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

function readVerticesInSvg(svgPath) {
    var vertices = [];
    //this is ugly
    var points = svgPath.getElementById('Unnamed').getAttribute('d').split("            ");
    var position = points[0];
    var curvePoints = points.slice(1);
    for (var i = 0; i< curvePoints.length; i++) {
        var arc = curvePoints[i].trim();
        var coordinates = arc.split(' ');
        //take only the middle point ([1]), discard the handles([0] and [2]) of the point of
        //the bezier curve. We will use the Catmull-Rom curve
        var point = coordinates[1];
        // do not consider values like 'C' and 'Z' that has length == 1. We already know that is a curve and that is closed
        if (point.length > 1) {
            var pointCoord = point.split(',');
            vertices.push( new THREE.Vector3(pointCoord[0], pointCoord[1], 0));
        }
    }
    return vertices;
}

function createCurveFromVertices(vertices){
    // THREE.Curve has not matrix transformation, I've to apply transformation to vertices
    for (i = 0; i< vertices.length; i++) {
        // center the path on the terrain
        vertices[i].applyMatrix4( new THREE.Matrix4().makeTranslation( -side/2, -side/2, -cameraHeight ) );
        // apply a rotation to the path that is equal to the rotation applied to the plane
        vertices[i].applyMatrix4( new THREE.Matrix4().makeRotationX( + planeRotation) );
    }
    var curve = new THREE.CatmullRomCurve3(vertices);
    curve.closed = true;
    return curve;
}

function getRandomArbitrary(min, max){
    return Math.random() * (max -min) +min;
}
