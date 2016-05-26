var plyFile = 'assets/ply/tree.ply';
var container, camera, controls, scene, renderer, stats;
var displacement, noise, uniforms;
var camera_z_position = 1000;
var camera_y_position = -170;
var nTree = 60;
var centerOffset = 40;
var trees = [];

var loadTree = function() {
    var d = $.Deferred();

    uniforms = {
        amplitude: { type: "f", value: 1.0 },
        color:     { type: "c", value: new THREE.Color( 0xff2200 ) },
    };

    var customMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent
    });
    customMaterial.side = THREE.BackSide;

    var loader = new THREE.PLYLoader();
    loader.load( plyFile, function ( ofMesh ) {
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
        var n = 0;
        var inc = (camera_z_position * 2) / nTree;
        for(var zpos = -camera_z_position;zpos < camera_z_position; zpos += inc){
            var tree = new THREE.Mesh( treeGeometry, customMaterial );
            var pos = getRandomPosition();
            tree.position.z = zpos;
            tree.position.x = pos.x;
            tree.position.y = pos.y;
            tree.rotation.y = Math.PI / getRandomArbitrary(-3, 3);
            tree.scale.multiplyScalar( 1 );
            trees.push(tree);
            n++;
        }
        d.resolve();
    });
    return d.promise();
};

$.when(loadTree()).then(function(){
        //if model loaded OK
        init();
        animate();
    },
    //if smth went wrong
    // TODO add error messages
    function(){
        console.log("i was not able to load the assets");
    }
);

function init() {
    camera = new THREE.PerspectiveCamera( 120, window.innerWidth / window.innerHeight, 1, 4000 );
    camera.position.z = camera_z_position;
    camera.position.y = camera_y_position;
    //controls = new THREE.OrbitControls( camera );
    //controls.addEventListener( 'change', render );
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0xFFFFFF, 0.002 );
    for(var n = 0, tree; tree = trees[n]; n++){
        scene.add(tree);
    }

    renderer = new THREE.WebGLRenderer( { antialias: true, depth:true} );
    renderer.setSize( window.innerWidth, window.innerHeight );

    //container DOM
    container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );

    stats = new Stats();
    stats.showPanel( 0 );
    container.appendChild(stats.domElement);
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
  //controls.update();
  render();
  stats.update();
  run();
}

function render() {
    //update displacement

     // var time = Date.now() * 0.01;
     // uniforms.amplitude.value = 2.5 * Math.sin( time * 0.125 );
     // uniforms.color.value.offsetHSL( 0.0005, 0, 0 );
     // for ( var i = 0; i < displacement.length; i ++ ) {
     //     displacement[ i ] = Math.sin( 0.1 * i + time );
     //     noise[ i ] += 0.5 * ( 0.5 - Math.random() );
     //     noise[ i ] = THREE.Math.clamp( noise[ i ], -5, 5 );
     //     displacement[ i ] += noise[ i ];
     // }

     // for(var n = 0, tree; tree = trees[n]; n++){
     //     tree.geometry.attributes.displacement.needsUpdate = true;
     // }
    renderer.render( scene, camera );
}

function run(){
     var speed = 4;
     for(var n = 0, tree; tree = trees[n]; n++){
         tree.position.z += 1 * speed;
         if(tree.position.z >= camera_z_position ){
            tree.position.z = -camera_z_position;
         }
     }
}


//helpers
function getRandomArbitrary(min, max){
    return Math.random() * (max -min) +min;
}

function getRandomPosition(){
    var pos = {};
    pos.x = Math.random() * 1000 -500;
    pos.y = -200;

    //do not put trees in the middle
    if(pos.x > -centerOffset && pos.x <= 0 ){
        pos.x = getRandomArbitrary(-500, -centerOffset);
    }

    if(pos.x < centerOffset && pos.x > 0){
        pos.x = getRandomArbitrary(centerOffset, 500);
    }
    return pos;
}
