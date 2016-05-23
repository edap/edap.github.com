var plyFile = 'assets/ply/tree.ply';
var container, camera, controls, scene, renderer;
var displacement, noise, uniforms;
var camera_z_position = 1000;
var mesh;

var loadTree = function() {
    var d = $.Deferred();
    var customMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent
    });
    customMaterial.side = THREE.BackSide;
    // ply model
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

        mesh = new THREE.Mesh( treeGeometry, customMaterial );
        mesh.position.y = - 1800.25;
        mesh.position.z = -200;
        mesh.scale.multiplyScalar( 8 );

        //mesh.castShadow = true;
        //mesh.receiveShadow = true;
        //scene.add( mesh);
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
        console.log(error);
    }
);

function init() {
    camera = new THREE.PerspectiveCamera( 120, window.innerWidth / window.innerHeight, 1, 4000 );
    camera.position.z = camera_z_position;
    controls = new THREE.OrbitControls( camera );
    controls.addEventListener( 'change', render );
    scene = new THREE.Scene();
    scene.add(mesh);

    // uniforms
    uniforms = {
        amplitude: { type: "f", value: 1.0 },
        color:     { type: "c", value: new THREE.Color( 0xff2200 ) },
    };

    // lights
    light = new THREE.DirectionalLight( 0xD1A6ED );
    light.position.set( 1, 1, 1 );
    scene.add( light );

    light = new THREE.DirectionalLight( 0x002288 );
    light.position.set( -1, -1, -1 );
    scene.add( light );

    light = new THREE.AmbientLight( 0x99C794 );
    scene.add( light );

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
  controls.update();
}

function render() {
    //update displacement
    uniforms.amplitude.value = 2.5 * Math.sin( time * 0.125 );
    uniforms.color.value.offsetHSL( 0.0005, 0, 0 );
    var time = Date.now() * 0.01;
    for ( var i = 0; i < displacement.length; i ++ ) {
        displacement[ i ] = Math.sin( 0.1 * i + time );
        noise[ i ] += 0.5 * ( 0.5 - Math.random() );
        noise[ i ] = THREE.Math.clamp( noise[ i ], -5, 5 );
        displacement[ i ] += noise[ i ];
    }
    mesh.geometry.attributes.displacement.needsUpdate = true;
    renderer.render( scene, camera );
}
