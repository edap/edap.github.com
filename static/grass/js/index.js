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


var vertexShader = `
        precision mediump float;
        uniform float globalTime;
        uniform float magnitude;
        uniform vec2 uvScale;
        uniform vec3 lightPos;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec4 vLightPos;
        varying vec4 vecPos;

        float random (in vec2 st) {
            return fract(sin(dot(st.xy,
                                vec2(12.9898,78.233)))
                * 43758.5453123);
        }


        // 2D Noise based on Morgan McGuire @morgan3d
        // https://www.shadertoy.com/view/4dS3Wd
        float noise (in vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);

            // Four corners in 2D of a tile
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));

            // Cubic Hermine Curve.  Same as SmoothStep()
            vec2 u = f*f*(3.0-2.0*f);
            // u = smoothstep(0.,1.,f);

            // Mix 4 coorners porcentages
            return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
        }


        void main() {
            vNormal =  (modelMatrix * vec4(normal, 0.0)).xyz;
            vec3 pos = position;
            // animate only the pixels that are upon the ground
            if (pos.y > 1.0) {
                float noised = noise(pos.xy);
                pos.y += sin(globalTime * magnitude * noised);
                pos.z += sin(globalTime * magnitude * noised);
                if (pos.y > 1.7){
                    pos.x += sin(globalTime * noised);
                }
            }
            vUv = uvScale * uv;
            vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
            vLightPos = projectionMatrix * modelViewMatrix * vec4(lightPos, 1.0);
            vecPos = projectionMatrix * mvPosition;
            gl_Position = vecPos;
        }
`;

var fragmentShader = `
          uniform vec3 lightColor;
          uniform float lightPower;
          uniform float ambientLightPower;
          uniform sampler2D texture;
          varying vec3 vNormal;
          varying vec2 vUv;
          varying vec4 vLightPos;
          varying vec4 vecPos;

          const float threshold = 0.48;
          void main() {
              vec4 textureColor = texture2D(texture, vec2(vUv.s, vUv.t));
              if (textureColor[0] < threshold && textureColor[1] < threshold && textureColor[2] < threshold) {
                  discard;
              } else {
                  // http://www.opengl-tutorial.org/beginners-tutorials/tutorial-8-basic-shading/

                  // shadow at the end of the word, add this value in the final moltiplication
                  // in order to see it, ex
                  // depthColor * textureColor * lightColor * lightPower * cosTheta / (dist * dist);
                  // float depth = gl_FragCoord.z / gl_FragCoord.w;
                  // float near = 250.0;
                  // float far = 500.0;
                  // float depthcolor = 0.8 - smoothstep( near, far, depth );
                  // float depthcolor = smoothstep( near, far, depth ) - 0.2;
                  float dist = length(vLightPos - vecPos) * 0.0015;
                  vec4 lightColor = vec4(lightColor, 1.0);
                  vec3 lightDirection = normalize(vecPos.xyz - vLightPos.xyz);
                  float cosTheta = clamp( dot( vNormal,lightDirection ),0.0, 1.0);
                  vec4 materialAmbientColor = vec4(vec3(ambientLightPower), 1.0) * textureColor;
                  //float attenuation = 1.0 / (1.0 + 0.2 * pow(length(vLightPos - vecPos), 2.0));
                  gl_FragColor = materialAmbientColor +
                                 //attenuation +
                                 textureColor * lightColor * lightPower * cosTheta / (dist * dist);


              }
          }
`;

//gui
var Config = function(){
    this.lightColor = '#872b17';
    this.lightPower = 0.2;
    this.ambientLightPower = 0.15;
    this.magnitude = 0.6;
};
var config = new Config();

$.when(
    loadTexture('/grass/images/portugal-seamless-gold.jpg'),
    //loadTexture('images/thingrass-gold.jpg'),
    //loadTexture('images/thingrass-gold2.jpg'),
    loadTexture('/grass/images/thingrass-gold3.jpg'),
    loadTexture('/grass/images/ground-diffuse.jpg')
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
    uniforms = setUniforms(grassTexture);
    grassMaterial = getGrassShaderMaterial(uniforms);
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
        vertexShader:   vertexShader,
        fragmentShader: fragmentShader,
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
        function (texture) {
            d.resolve(texture);
        },
        function (xhr) {
            d.notify((xhr.loaded / xhr.total * 100) + '% loaded');
        },
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
    //gui.addColor(config, 'lightColor').name('light color').onChange( onLightColorUpdate );
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

var onMagnitudeUpdate = function(_) {
    grassMaterial.uniforms.magnitude.value = config.magnitude;
};

var onLightPowerUpdate = function(_) {
    grassMaterial.uniforms.lightPower.value = config.lightPower;
};

var onAmbientLightPowerUpdate = function(_) {
    grassMaterial.uniforms.ambientLightPower.value = config.ambientLightPower;
};

var onLightColorUpdate = function(_) {
    light.color.set(config.lightColor);
    grassMaterial.uniforms.lightColor.value.set(config.lightColor);
};

function setOrbitControlsLimits(controls){
    controls.minPolarAngle = 1.2;
    controls.maxPolarAngle = Math.PI/2.1;
}


