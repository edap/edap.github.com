import { Vector3, Box3Helper, BoxGeometry, MeshBasicMaterial, Mesh } from "three"

export const isMobile = () => {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export const updateCameraForTableVisibility = (tableSize, camera, mobileDebug, screenSize) => {
    if (!tableSize) return;

    const aspectRatio = screenSize.width / screenSize.height;
    const isMobile = window.innerWidth < 768;

    // Dynamically set FOV based on orientation and device
    if (aspectRatio < 1) {
        // Portrait: much wider FOV for tall screens
        camera.fov = 55;
    } else if (isMobile) {
        // Mobile landscape: slightly wider FOV
        camera.fov = 40;
    } else {
        // Desktop/large screens: default FOV
        camera.fov = 30;
    }
    camera.updateProjectionMatrix();

    const tableWidth = tableSize.width;
    const tableDepth = tableSize.depth;
    const tableHeight = tableSize.height;

    const fovRadians = (camera.fov * Math.PI) / 180;

    // Calculate distances needed to fit width and depth
    // Use a margin factor to avoid clipping
    const margin = 1.08; // 8% margin
    const distForWidth = (tableWidth * margin) / (2 * Math.tan(fovRadians / 2));
    const distForDepth = (tableDepth * margin) / (2 * Math.tan(fovRadians / 2) * aspectRatio);

    // Use the larger of the two (so the table always fits)
    const cameraZ = Math.max(distForWidth, distForDepth);
    //const cameraY = tableHeight * 5.4;
    const cameraY = 1;

    camera.position.set(0, cameraY, cameraZ);
    camera.lookAt(new Vector3(0, tableHeight, 0));

    if (mobileDebug) {
        mobileDebug.log(`📐 Camera adjusted: pos(${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}) FOV: ${camera.fov}° `);
    }
}

export function addDebugBox(w, h, d, scene) {
    let mat = new MeshBasicMaterial({ color: 0xff0000 });
    let g = new BoxGeometry(w, h, d);
    let m = new Mesh(g, mat);
    scene.add(m);
}

export function addDebugBox3D(box, scene) {
    const boxHelper = new Box3Helper(box, 0x00ff00);
    scene.add(boxHelper);
}

// Not used
export const toScreen = (x, y, z, camera) => {
    const vector = new THREE.Vector3(x, y, z);
    vector.project(camera); // Projects to normalized device coordinates (NDC)

    const widthHalf = screenSize.width / 2;
    const heightHalf = screenSize.height / 2;

    vector.x = (vector.x * widthHalf) + widthHalf;
    vector.y = -(vector.y * heightHalf) + heightHalf;

    return vector;
}

// Not used
export const toWorld = (x, y, zPlane = 0, camera) => {
    // Convert screen coords to normalized device coordinates (NDC)
    const vector = new THREE.Vector3(
        (x / screenSize.width) * 2 - 1,
        -(y / screenSize.height) * 2 + 1,
        0.5
    );

    // Convert NDC to world coordinates
    vector.unproject(camera);

    // Calculate a direction vector from the camera to the unprojected point
    const dir = vector.sub(camera.position).normalize();

    // Determine the distance from the camera to the desired z-plane
    const distance = (zPlane - camera.position.z) / dir.z;

    // Return the world coordinate on the given z-plane
    return camera.position.clone().add(dir.multiplyScalar(distance));
}