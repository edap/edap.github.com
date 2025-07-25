import { 
    Box3Helper, BoxGeometry, MeshBasicMaterial, Mesh, 
    SpotLight, AmbientLight, DirectionalLight,  Vector3} from "three"

export const isMobile = () => {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

const worldPosition = new Vector3()

export const setupLighting = (scene) => {
    // Minimal, clean lighting
    //const ambient = new AmbientLight(0xffffff, 1.9);
    //scene.add(ambient);
    const dir = new DirectionalLight(0xffffff, 4.7);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // if (!isMobile()) {
    //     let spotLight = new SpotLight(0xffffff, 13.8);
    //     spotLight.position.set(0, 1.0, 2.6);
    //     spotLight.target.position.set(0, 0, 0.0);
    //     spotLight.target.updateMatrixWorld();
    //     scene.add(spotLight);

    //     //const spotLightHelper = new SpotLightHelper( spotLight );
    //     //scene.add( spotLightHelper );
    // }
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