import { 
    Box3Helper, BoxGeometry, MeshBasicMaterial, Mesh, 
    SpotLight, AmbientLight, DirectionalLight,  Vector3} from "three"

export const isMobile = () => {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

const worldPosition = new Vector3()

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

export const setupLighting = (scene) => {
    // Minimal, clean lighting
    const ambient = new AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const dir = new DirectionalLight(0xffffff, 1.7);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    if (!isMobile()) {
        let spotLight = new SpotLight(0xffffff, 13.8);
        spotLight.position.set(0, 1.0, 2.6);
        spotLight.target.position.set(0, 0, 0.0);
        spotLight.target.updateMatrixWorld();
        scene.add(spotLight);

        //const spotLightHelper = new SpotLightHelper( spotLight );
        //scene.add( spotLightHelper );
    }
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

export const createSettings = () => {

    //size in meters
    let width = 10;
    let depth = 20;
    let height = 5;
    let tableWidth = 1.5;

    let quality = 0;

    let settings = {
        debug: false,
        wallMode: false,
        width: width,
        height: height,
        depth: depth,
        table: {
            model: "models/table.glb",
            width: tableWidth,
            // color: 0x2b476e,
            // texture: "images/table.jpg"
        },

        audio: {
            ball: ["audio/ball1.ogg", "audio/ball2.ogg"]
            // Random Mode sounds loaded automatically by AudioManager
        },

        mobile: {
            enabled: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            touchSensitivity: 0.8,
            objectScale: 1.5 
        }
    };

    return settings;
}

export const getRandomCategory = (data) => {
    const keys = Object.keys(data);
    if (keys.length === 0) {
        console.warn('No categories found in JSON.');
        return null;
    }
    const randomKey = keys[Math.floor(Math.random() * keys.length)];

    return {
        key: randomKey,
        ...data[randomKey]
    };
}

export const setBallPosition = (paddle, ballRadius, ball) =>{
    const paddleTip = paddle.getObjectByName('paddle-tip');
    paddleTip.getWorldPosition(worldPosition);
    ball.position.set(worldPosition.x,worldPosition.y, worldPosition.z - ballRadius);
}