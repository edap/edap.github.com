var container, camera, controls, scene, renderer, stats;
var displacement, noise, uniforms;
var camera_z_position = 1000;

//if model loaded OK
init();
animate();

function init() {
    camera = new THREE.PerspectiveCamera( 120, window.innerWidth / window.innerHeight, 1, 4000 );
    camera.position.z = camera_z_position;
    controls = new THREE.OrbitControls( camera );
    controls.addEventListener( 'change', render );
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer( { antialias: true, depth:true} );
    renderer.setSize( window.innerWidth, window.innerHeight );

    //container DOM
    container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );

    stats = new Stats();
    stats.showPanel( 0 );
    container.appendChild(stats.domElement);
    window.addEventListener( 'resize', onWindowResize, false );
    //Texture
// stavi iniziando le texture da qui https://github.com/mrdoob/three.js/blob/master/examples/webgl_terrain_dynamic.html
                    var loadingManager = new THREE.LoadingManager( function(){
                    terrain.visible = true;
                });
                var textureLoader = new THREE.TextureLoader( loadingManager );

    createTerrain();
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
    renderer.render( scene, camera );
}

function createTerrain(){
    var geometry = new THREE.PlaneBufferGeometry(2000, 2000, 20);
    geometry.rotateX( - Math.PI / 2.5);
    var material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
    var plane = new THREE.Mesh( geometry, material );
    scene.add( plane );
}
