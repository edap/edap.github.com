import * as THREE from 'three';

const side = 2;

export function createBGMaterial(scene, gradientCenterCol, gradientBorderCol) {
    let g = new THREE.PlaneGeometry(side, side);
    let m = new THREE.ShaderMaterial({
        uniforms: {
          color1: { value: new THREE.Color(gradientCenterCol)},
          color2: { value: new THREE.Color(gradientBorderCol)},
          ratio: {value: innerWidth / innerHeight}
        },
        vertexShader: `varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = vec4(position, 1.);
          }`,
        fragmentShader: `varying vec2 vUv;
            uniform vec3 color1;
            uniform vec3 color2;
            uniform float ratio;
            void main(){
                vec2 uv = (vUv - 0.5) * vec2(ratio, 1.);
              gl_FragColor = vec4( mix( color1, color2, length(uv)), 1. );
            }`,
            depthWrite: false,
            depthTest: false,
            side: THREE.DoubleSide
    })
    let p = new THREE.Mesh(g, m);
    p.renderOrder = -1;
    p.position.set(0,1,-2.3);
    scene.add(p)
    return m;
}

