
import * as THREE from "three";

/**
 * Draws a green arrow in the scene. Useful for visualizing positions and directions.
 *
 * @param {THREE.Scene} scene - The Three.js scene to add the arrow to.
 * @param {THREE.Vector3} position - The starting position of the arrow.
 * @param {THREE.Vector3} direction - The direction the arrow should point towards. Will be normalized.
 * @param {number} [length=0.1] - The length of the arrow.
 * @param {number} [headLength=0.02] - The length of the arrow's head.
 * @param {number} [headWidth=0.01] - The width of the arrow's head.
 * @returns {THREE.ArrowHelper} The created ArrowHelper object.
 */
export const drawArrow = (scene, position, direction, length = 0.1, headLength = 0.02, headWidth = 0.01) => {
    // Normalize the direction vector to ensure consistent arrow length
    const normalizedDirection = direction.clone().normalize();

    const arrow = new THREE.ArrowHelper(
        normalizedDirection, // Direction vector (must be normalized)
        position,            // Origin position
        length,              // Length of the arrow
        0x00ff00,            // Color (green)
        headLength,          // Length of the arrowhead
        headWidth            // Width of the arrowhead
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
