
import * as THREE from "three";

export const drawArrow = (scene, position, direction, length = 0.1, headLength = 0.02, headWidth = 0.01) => {
    const normalizedDirection = direction.clone().normalize();

    const arrow = new THREE.ArrowHelper(
        normalizedDirection,
        position,
        length,
        0x00ff00,
        headLength,
        headWidth
    );

    scene.add(arrow);
    return arrow;
};

export function addDebugBox(w, h, d, scene) {
    let mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    let g = new THREE.BoxGeometry(w, h, d);
    let m = new THREE.Mesh(g, mat);
    scene.add(m);
}

export function addDebugBox3D(box, scene) {
    const boxHelper = new THREE.Box3Helper(box, 0x00ff00);
    scene.add(boxHelper);
}
