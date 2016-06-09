var container, camera, controls, scene, renderer, stats, gui;
//Terrain
var bumpScale = 200;
var terrain;

//Path and camera
var pathGeometry;
var spline;
var t = 0;
var cameraSpeed = 0.0012;
var current_position_in_path = 0;
var plane_rotation = Math.PI/2;
var camera_z_position = 1000;


//if model loaded OK
init();
animate();

function init() {
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 4000 );
    //camera.position.z = camera_z_position;
    controls = new THREE.OrbitControls( camera );
    controls.addEventListener( 'change', render );
    scene = new THREE.Scene();

    // Create Light
    var light = new THREE.PointLight(0xFFFFFF);
    light.position.set(0, 0, 500);
    scene.add(light);

    renderer = new THREE.WebGLRenderer( { antialias: true, depth:true} );
    renderer.setSize( window.innerWidth, window.innerHeight );

    //container DOM
    container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );

    var bumpTexture = loadTexture( 'terrain.png' );
    var customMaterial = createCustomMaterial( bumpTexture );

    var geometryPlane = new THREE.PlaneBufferGeometry(1024, 1024, 50, 50);
    geometryPlane.rotateX( - plane_rotation);
    terrain = new THREE.Mesh( geometryPlane, customMaterial );
    scene.add( terrain );

    var path = loadSvg('path.svg');

    var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
    spline = createCurve();
    pathGeometry = createSplineGeometry(spline);
    var splineObject = new THREE.Line( pathGeometry, material );
    //scene.add( splineObject );


    camera.position.set(pathGeometry.vertices[0]);
    addGui( customMaterial );
    addStats();
}

function createCustomMaterial( texture ) {
    var myUniforms = {
        bumpScale: {type: 'f', value: bumpScale},
        bumpTexture: {type: 't', value: texture}
    };

    var customMaterial = new THREE.ShaderMaterial({
        uniforms: myUniforms,
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent,
    });

    return customMaterial;
}

function createCurve(){
    var vertices =[
        new THREE.Vector3( 180, 0, 0 ),
        new THREE.Vector3( 1800, 0, 0 ),
        new THREE.Vector3( 1800, 1800, 0 ),
        new THREE.Vector3( 0, 1800, 0 ),
        new THREE.Vector3( 0, 1000, 0 ),
        new THREE.Vector3( 800, 1000, 0 ),
        new THREE.Vector3( 1200, 500, 0 ),
        new THREE.Vector3( 0, 600, 0 ),
        new THREE.Vector3( 0, 300, 0 ),
        new THREE.Vector3( 80, 50, 0 ),
        new THREE.Vector3( 180, 0, 0 ),
    ];

    // THREE.Curve has not matrix transformation, I've to apply transformation to vertices
    for (i = 0; i< vertices.length; i++){
        vertices[i].applyMatrix4( new THREE.Matrix4().makeTranslation( -1000, -1000, 200 ) );
        vertices[i].applyMatrix4( new THREE.Matrix4().makeRotationX( - plane_rotation) );
        vertices[i].applyMatrix4( new THREE.Matrix4().makeScale(0.8,0.8,0.8));
    }
    //var curve = new THREE.SplineCurve3( vertices );
    var curve = new THREE.CatmullRomCurve3( vertices );
    return curve;
}

function createSplineGeometry(curve){
    var geometry = new THREE.Geometry();
    geometry.vertices = curve.getPoints( 100 );
    return geometry;
}

function loadTexture( filename ){
    var loadingManager = new THREE.LoadingManager( function(){
        terrain.visible = true;
    });
    var textureLoader = new THREE.TextureLoader( loadingManager );
    var bumpTexture = textureLoader.load(filename);
    bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping;

    return bumpTexture;
}

function loadSvg( filename ){
    var svgLoader = new THREE.SVGLoader();
    svgLoader.load(
        filename,
        //success callback
        function( svg ){
            console.log('done');
        },
        //progress callback
        function ( xhr ) {
            console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
        },
        //error callback
        function( xhr ){ console.log( 'error while loading svg' )}
    );
}


function addGui(customMaterial){
    gui = new dat.GUI();
    gui.add(customMaterial.uniforms.bumpScale, 'value')
        .name('bumpScale').min(20).max(300).step(1.0);
    gui.close();
}

function addStats(){
    stats = new Stats();
    stats.showPanel( 0 );
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
  //controls.update();
  render();
  stats.update();
}

function render() {
    moveCamera();
    renderer.render( scene, camera );
}

function moveCamera(){
    var camPos = spline.getPointAt(t);
    camera.position.set(camPos.x,camPos.y,camPos.z);
    // no need to roatate beacuse the path is always on y = 0
    // if in the future you will have a path that goes up and down
    // use the rotation too
    //var camRot = spline.getTangent(t);
    //camera.rotation.set(camRot.x,camRot.y,camRot.z);
    // even better, using quaternions
    // http://stackoverflow.com/questions/18400667/three-js-object-following-a-spline-path-rotation-tanget-issues-constant-sp
    // http://stackoverflow.com/questions/11179327/orient-objects-rotation-to-a-spline-point-tangent-in-three-js
    camera.lookAt(spline.getPointAt(t + cameraSpeed * 2));
    t = (t >= 0.99) ? 0 : t += cameraSpeed;
}
