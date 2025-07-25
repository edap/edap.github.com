import * as THREE from "three"
import { addDebugBox3D } from "./debug_helpers.js";

const getModelScale = (model, desiredWidth) => {
    const box = new THREE.Box3().setFromObject(model);
    const modelActualWidth = box.max.x - box.min.x;
    return desiredWidth / modelActualWidth;
}

export const getMaterialFromGlb = (glb) => {
    const table = glb.scene.getObjectByName("table");
    console.log(table.material)
    if (!table && !table.material) {
        console.error("Table not found in GLB model!");
        return new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    } else {
        return table.material;
    }
}

export const createTable = (glb, settings, simulation, scene, tableSize, mat) => {
    const table = glb.scene.getObjectByName("table");
    if (!table) {
        console.error("Table object not found in GLB model!");
        return null;
    }

    if (mat) {
        table.material = mat;
    }

    const scale = getModelScale(table, settings.table.width);
    table.scale.set(scale, scale, scale);

    const box = new THREE.Box3().setFromObject(table);
    const modelOriginalSize = {
        width: box.max.x - box.min.x,
        depth: box.max.z - box.min.z,
        height: box.max.y - box.min.y
    };

    // Update the tableSize object with scaled dimensions
    tableSize.width = modelOriginalSize.width * scale;
    tableSize.depth = modelOriginalSize.depth * scale;
    tableSize.height = modelOriginalSize.height * scale;
    tableSize.scale = scale;

    const collisionBoxTable = new THREE.Box3().setFromObject(table);
    collisionBoxTable.name = 'table'
    if (settings.debug) {
        addDebugBox3D(collisionBoxTable, scene);
    }
    simulation.addBox(collisionBoxTable);

    table.matrixAutoUpdate = false;
    table.updateMatrix();
    scene.add(table);

    //console.log('tableSize dimensions:', tableSize.width, tableSize.height, tableSize.depth);
    return table;
}

export const createNet = (glb, settings, simulation, scene, tableSize, scaleFactor = 1, mat) => {
    const net = glb.scene.getObjectByName("net");
    if (!net) {
        console.warn("Net object not found in GLB model!");
        return null;
    }

    if (mat) {
        net.material = mat;
    }

    // Scale net based on table scale
    net.scale.set(tableSize.scale, tableSize.scale / scaleFactor, tableSize.scale);
    scene.add(net);

    // Optional wall mode for net collision
    if (settings.wallMode) {
        const collisionBoxNet = new THREE.Box3().setFromObject(net);
        collisionBoxNet.name = 'net'
        simulation.addBox(collisionBoxNet);
        if (settings.debug) {
            addDebugBox3D(collisionBoxNet, scene);
        }
    }
    return net;
}

export const createPaddles = (glb, scene, tableSize, settings, scaleFactor = 1, mat) => {
    const playerPaddle = glb.scene.getObjectByName("paddle");
    if (!playerPaddle) {
        console.error("Paddle object not found in GLB model!");
        return { player: null, ai: null };
    }

    if (mat) {
        playerPaddle.material = mat;
    }

    const finalPaddleScale = tableSize.scale * scaleFactor;
    playerPaddle.scale.set(finalPaddleScale, finalPaddleScale, finalPaddleScale);

    playerPaddle.position.set(0, tableSize.height, tableSize.depth / 2);
    scene.add(playerPaddle);

    // Create AI paddle by cloning
    const aiPaddle = playerPaddle.clone();
    aiPaddle.position.set(0, tableSize.height, -tableSize.depth / 2);
    scene.add(aiPaddle);

    // Compute paddleSize (this will now reflect the new scale)
    const box = new THREE.Box3().setFromObject(playerPaddle);
    const paddleSize = {
        width: box.max.x - box.min.x,
        depth: box.max.z - box.min.z,
        height: box.max.y - box.min.y
    };

    addMarkerToPaddle(playerPaddle, paddleSize, "paddle-tip", settings.debug, scaleFactor);
    return { player: playerPaddle, ai: aiPaddle, size: paddleSize };
}

export const createBall = (scene, simulation, tableSize, paddleSize, scaleFactor = 1) => {
    const ballRadius = paddleSize.width * 0.13 * scaleFactor;

    let ballGeometry = new THREE.SphereGeometry(ballRadius, 16, 16);
    let ballMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);

    ball.position.set(0, tableSize.height * 2, tableSize.depth * 0.25);
    scene.add(ball);
    simulation.setBall(ball, ballRadius);

    return { object: ball, radius: ballRadius };
}


const addMarkerToPaddle = (paddle, paddleSize, name, debug, scaleFactor = 1) => {
    const childGeometry = new THREE.BoxGeometry(
        0.02 * scaleFactor,
        0.02 * scaleFactor,
        0.02 * scaleFactor
    );
    const childMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const childObject = new THREE.Mesh(childGeometry, childMaterial);
    childObject.name = name;

    if (!debug) {
        childObject.visible = false;
    }

    childObject.position.set(0, paddleSize.height / scaleFactor, 0, (-paddleSize.depth / 2));
    paddle.add(childObject);
}