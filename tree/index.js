var objFile = 'assets/obj/test.obj';
var plyFile = 'assets/obj/test.ply';
var container, camera, scene, renderer;
var camera_z_position = 1000;
// Interaction
var mouseX = 0, mouseY = 0;
var mouse = new THREE.Vector2(), raycaster, INTERSECTED, mouseDown, clickedY;

init();
animate();

function init() {
    camera = new THREE.PerspectiveCamera( 120, window.innerWidth / window.innerHeight, 1, 4000 );
    camera.position.z = camera_z_position;

    // fog
    scene = new THREE.Scene();
    //scene.fog = new THREE.FogExp2( 0xFFFFFF, 0.002 );

    // lights
    light = new THREE.DirectionalLight( 0xD1A6ED );
    light.position.set( 1, 1, 1 );
    scene.add( light );

    light = new THREE.DirectionalLight( 0x002288 );
    light.position.set( -1, -1, -1 );
    scene.add( light );

    light = new THREE.AmbientLight( 0x99C794 );
    scene.add( light );

    //make driver object
    makeTree();
    renderer = new THREE.WebGLRenderer( { antialias: true, depth:true} );
    renderer.setSize( window.innerWidth, window.innerHeight );

    //container DOM
    container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );
    window.addEventListener( 'resize', onWindowResize, false );
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
}

function render() {
    renderer.render( scene, camera );
}

function makeTree(){
    // load manager
    var manager = new THREE.LoadingManager();
    manager.onProgress = function(item, loaded, total){
      console.log(item, loaded, total);
    };

    var onProgress = function ( xhr ) {
        if ( xhr.lengthComputable ) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log( Math.round(percentComplete, 2) + '% downloaded' );
        }
    };

    var onError = function ( xhr ) {
        console.log("Object can not be loaded");
    };
    // material for the three
    var material = new THREE.MeshPhongMaterial( {
        color: 0x555555,
        specular: 0x111111,
        shininess: 50
    } );
    // ply model
    var loader = new THREE.PLYLoader( manager );
    loader.load( plyFile, function ( geometry ) {
        geometry.computeFaceNormals();
        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.y = - 1800.25;
        mesh.scale.multiplyScalar( 8 );

        //mesh.castShadow = true;
        //mesh.receiveShadow = true;
        scene.add( mesh);
    }, onProgress, onError );

//    // obj loader
//    var objloader = new THREE.OBJLoader( manager );
//    objloader.load( objFile, function ( object ) {
//        object.traverse( function ( child ) {
//            if ( child instanceof THREE.Mesh ) {
//                child.material = material;
//            }
//        } );

//        object.position.y = - 1800.25;
//        object.position.z = -200;
//        object.scale.multiplyScalar( 8 );
//        //scene.add( object );
//    }, onProgress, onError );
}

