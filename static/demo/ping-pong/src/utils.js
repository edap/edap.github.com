import {
    SpotLight, 
    AmbientLight, 
    DirectionalLight,  
    Vector3
} from "three"

export const isMobile = () => {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export const is4KMonitor = () => {
    const min4KWidth = 3840;
    const min4KHeight = 2160;

    if (screen.width >= min4KWidth && screen.height >= min4KHeight) {
        return true;
    }

    return false;
}

export const getRendererSize = () => {
    let width = window.innerWidth;
    let height = window.innerHeight;

    if (isMobile()) {
        // Render at a lower resolution on mobile to save GPU power
        // Experiment with factors like 0.75 or 0.5 for mobile
        const mobileResolutionScale = 0.75; // Or 0.5 for even bigger perf gain
        width = Math.floor(width * mobileResolutionScale);
        height = Math.floor(height * mobileResolutionScale);
    } else if (is4KMonitor()) { // You'd need a function to detect this
        // For 4K, target 1080p equivalent internal resolution
        const desktop4KResolutionScale = 0.5; // Render at half width/height for 4K = 1080p
        width = Math.floor(width * desktop4KResolutionScale);
        height = Math.floor(height * desktop4KResolutionScale);
    }

    return {width, height};
}

const worldPosition = new Vector3()

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
        wallMode: true,
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
            objectScale: 1.6
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