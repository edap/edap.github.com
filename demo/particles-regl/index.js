const regl = require('regl')();
const camera = require('regl-camera')(regl, { minDistance: 1, distance: 41, phi:0.5, theta:1.3 });
const isosurface = require('isosurface');
const convert = require('color-convert');
const glsl = require('glslify');
const hsv2rgb = require('hsv2rgb');
const control = require('control-panel');

let state = {
    particleSize:1.4,
    particleHue:126,
    noiseAmplitude:3.0,
    freq:2.0,
    noiseSurfaceFreq:8.0,
    bgColor: '#0000FF',
    surface: 'sphere',
    bgColorFloat:[0.0,0.0,1.0,1],
    totVertices: 0
};

//GUI
let updateState = (data) => {
    let col = convert.hex.rgb(data.bgColor);
    state.bgColor = data.bgColor;
    state.bgColorFloat = [col[0]/255, col[1]/255, col[2]/255,1.0];

    state.particleSize = data.particleSize;
    state.freq = data.freq;
    state.noiseAmplitude = data.noiseAmplitude;
    state.noiseSurfaceFreq = data.noiseSurfaceFreq;

    if (data.surface != state.surface) {
        updateBuffers(data.surface);
        state.surface = data.surface;
    }

    if (data.particleHue != state.particleHue) {
        updateColorBuffer(state.totVertices, data.particleHue);
        state.particleHue = data.particleHue;
    }
};

let panel = control(
    [
        {type: 'range', label: 'particleSize', min: 0.2, max: 5, initial: state.particleSize},
        {type: 'range', label: 'particleHue', min: 1.0, max: 256, initial: state.particleHue},
        {type: 'range', label: 'freq', min: 0.0, max: 30.0, initial: state.freq},
        {type: 'range', label: 'noiseAmplitude', min: 0.0, max: 10.0, initial: state.noiseAmplitude},
        {type: 'range', label: 'noiseSurfaceFreq', min: 0.0, max: 20.0, initial: state.noiseSurfaceFreq},
        {type: 'color', label: 'bgColor', format: 'hex', initial: state.bgColor},
        {type: 'select', label: 'surface', options:
         ['sphere', "Goursat's Surface",'Torus','Hyperelliptic','Nodal Cubic',"Nordstrand's Weird Surface", 'Sine Waves'],
         initial: 'sphere'}
    ],
    {theme: 'light', position: 'top-right'}
).on('input', (data) => { updateState(data); });


//Init buffers. The particleSurfaceBuffer contains the position of the points
// The colorBuffer contains the color for each point.
let mesh = isosurface.surfaceNets([180,180,180], (x,y,z) => {
    return x*x + y*y + z*z - 100;
}, [[-11,-11,-11], [11,11,11]]);
const particleSurfaceBuffer = regl.buffer(mesh.positions);
state.totVertices = mesh.positions.length;
const colorBuffer = regl.buffer(mesh.positions.length);
updateColorBuffer(mesh.positions.length, state.particleHue);
//end buffers initialization

function updateColorBuffer(totVertices, pHue){
    let updatedColors = Array(totVertices).fill().map( () => {
        const hue = Math.random() * pHue;
        const alpha = 1.0;
        const saturation = 0.7;
        const color = hsv2rgb(hue, saturation, alpha);
        return [
            color[0] / 255,
            color[1] / 255,
            color[2] / 255
        ];
    });
    colorBuffer({
        data: updatedColors
    });
};

let updateBuffers = (surfaceType) => {
    let mesh;
    switch(surfaceType){
    case 'sphere':
        mesh = isosurface.surfaceNets([180,180,180], (x,y,z) => {
            return x*x + y*y + z*z - 100;
        }, [[-11,-11,-11], [11,11,11]]);
        break;
    case "Goursat's Surface":
        mesh = isosurface.surfaceNets([300,300,300], (x,y,z) => {
            return Math.pow(x,4) + Math.pow(y,4) + Math.pow(z,4) - 1.5 * (x*x  + y*y + z*z) + 1;
        }, [[-11,-11,-11], [11,11,11]]);
        break;
    case "Torus":
        mesh = isosurface.surfaceNets([300,300,150], (x,y,z) => {
            return Math.pow(1.0 - Math.sqrt(x*x + y*y), 2) + z*z - 0.25;
        }, [[-11,-11,-11], [11,11,11]]);
        break;
    case 'Hyperelliptic':
        mesh = isosurface.surfaceNets([180,180,180], (x,y,z) => {
            return Math.pow( Math.pow(x, 6) + Math.pow(y, 6) + Math.pow(z, 6), 1.0/6.0 ) - 1.0;
        }, [[-11,-11,-11], [11,11,11]]);
        break;
    case 'Nodal Cubic':
        mesh = isosurface.surfaceNets([64,64,64], (x,y,z) => {
            return x*y + y*z + z*x + x*y*z;
        }, [[-11,-11,-11], [11,11,11]]);
        break;
    case "Nordstrand's Weird Surface":
        mesh = isosurface.surfaceNets([64,64,64], (x,y,z) => {
            return 25 * (Math.pow(x,3)*(y+z) + Math.pow(y,3)*(x+z) + Math.pow(z,3)*(x+y)) +
                50 * (x*x*y*y + x*x*z*z + y*y*z*z) -
                125 * (x*x*y*z + y*y*x*z+z*z*x*y) +
                60*x*y*z -
                4*(x*y+x*z+y*z);
        }, [[-11,-11,-11], [11,11,11]]);
        break;
    case 'Sine Waves':
        mesh = isosurface.surfaceNets([64,64,64], (x,y,z) => {
            return Math.sin(x) + Math.sin(y) + Math.sin(z);
        }, [[-11,-11,-11], [11,11,11]]);
        break;
    default:
        mesh = isosurface.surfaceNets([180,180,180], (x,y,z) => {
            return x*x + y*y + z*z - 100;
        }, [[-11,-11,-11], [11,11,11]]);
        break;
    }

    particleSurfaceBuffer({
        data:mesh.positions
    });
    state.totVertices = mesh.positions.length;
    updateColorBuffer(state.totVertices, state.particleHue);
};

const drawParticles = regl({
    vert: glsl`
    precision mediump float;
    attribute vec3 pos;
    attribute vec3 color;
    uniform float time;
    uniform mat4 view, projection;
    varying vec3 fragColor;
    uniform float particleSize;
    uniform float noiseAmplitude;
    uniform float freq;
    uniform float noiseSurfaceFreq;

    //noise
    #pragma glslify: pnoise = require('glsl-noise/periodic/3d')
    float noised;

    float shake( vec3 p ) {
        float t = -.5;

        for (float f = 1.0 ; f <= 10.0 ; f++ ){
            float power = pow( 2.0, f );
            t += abs( pnoise( vec3( power * p ), vec3( 10.0 ) ) / power );
        }
        return t;
    }

    void main() {
        // this normal is arbitrary, it is calculated from the center
        // of the screen to the vertex position. It is still correct with a sphere.
        vec3 normal = normalize(vec3(0.0,0.0,0.0) + vec3(pos));
        noised = noiseSurfaceFreq *  -.10 * shake( .5 * normal );
        float b = noiseAmplitude * pnoise( 0.05 * vec3(pos) + vec3( freq * time), vec3( 100.0 ) );
        float displacement = - 10. * noised + b;

        vec3 newPosition = vec3(pos) + normal * displacement;

        gl_PointSize = particleSize;
        gl_Position = projection * view * vec4(newPosition, 1);
        fragColor = color;
    }`,

    frag: `
    precision lowp float;

    varying vec3 fragColor;
    void main() {
        //this condition is used to make the particle rounded
        if (length(gl_PointCoord.xy - 0.5) > 0.5) {
            discard;
        }
        gl_FragColor = vec4(fragColor, 1);
    }`,

    attributes: {
        pos: {
            buffer: particleSurfaceBuffer
        },
        color:{
            buffer:colorBuffer
        }
    },

    uniforms: {
        time: ({tick}) => tick * 0.001,
        particleSize: regl.prop('particleSize'),
        freq: regl.prop('freq'),
        noiseAmplitude: regl.prop('noiseAmplitude'),
        noiseSurfaceFreq: regl.prop('noiseSurfaceFreq')
    },

    count: regl.prop('totVertices'),
    primitive: 'points'
});


regl.frame( () => {
    regl.clear({
        color: state.bgColorFloat,
        depth:1
    });

    camera( () => {
        drawParticles({
            particleSize: state.particleSize,
            noiseAmplitude: state.noiseAmplitude,
            freq: state.freq,
            noiseSurfaceFreq: state.noiseSurfaceFreq,
            totVertices: state.totVertices
        });
    });

});
