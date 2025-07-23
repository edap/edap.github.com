import * as THREE from "three"
import { addDebugBox3D } from "./utils.js";

const getModelScale = (model, desiredWidth) => {
    const box = new THREE.Box3().setFromObject(model);
    const modelActualWidth = box.max.x - box.min.x;
    return desiredWidth / modelActualWidth;
}

export const createTable = (glb, settings, simulation, scene, tableSize) => {
    const table = glb.scene.getObjectByName("table");
    if (!table) {
        console.error("Table object not found in GLB model!");
        return null;
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
    if (settings.debug) {
        addDebugBox3D(collisionBoxTable, scene);
    }
    simulation.addBox(collisionBoxTable);

    table.matrixAutoUpdate = false;
    table.updateMatrix();
    scene.add(table);
    return table;
}

export const createNet = (glb, settings, simulation, scene, tableSize) => {
    const net = glb.scene.getObjectByName("net");
    if (!net) {
        console.warn("Net object not found in GLB model!");
        return null;
    }

    // Scale net based on table scale
    net.scale.set(tableSize.scale, tableSize.scale, tableSize.scale);
    scene.add(net);

    // Optional wall mode for net collision
    if (settings.wallMode) {
        const netBox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(0, tableSize.height, 0),
            new THREE.Vector3(tableSize.width, tableSize.height * 4, tableSize.depth * 0.02)
        );
        simulation.addBox(netBox);

        // Debug cube for net hit box
        const netHitCube = new THREE.Mesh(
            new THREE.BoxGeometry(
                netBox.max.x - netBox.min.x,
                netBox.max.y - netBox.min.y,
                netBox.max.z - netBox.min.z
            ),
            new THREE.MeshBasicMaterial({ color: 0x000000 }) // Invisible material
        );
        netHitCube.position.y = tableSize.height; // Position at table height
        netHitCube.visible = false; // Keep it invisible
        scene.add(netHitCube);
    }

    return net;
}

export const createPaddles = (glb, scene, tableSize, settings, scaleFactor = 1) => { // Add scaleFactor with default 1
    const playerPaddle = glb.scene.getObjectByName("paddle");
    if (!playerPaddle) {
        console.error("Paddle object not found in GLB model!");
        return { player: null, ai: null };
    }

    // Apply both table scale and the new scaleFactor
    const finalPaddleScale = tableSize.scale * scaleFactor; // <-- Combine scales
    playerPaddle.scale.set(finalPaddleScale, finalPaddleScale, finalPaddleScale); // <-- Use combined scale

    // Set initial position for player paddle (centered at player's side)
    playerPaddle.position.set(0, tableSize.height, tableSize.depth / 2);
    scene.add(playerPaddle);

    // Create AI paddle by cloning
    const aiPaddle = playerPaddle.clone();
    aiPaddle.position.set(0, tableSize.height, -tableSize.depth / 2); // Position at AI side
    scene.add(aiPaddle);

    // Compute paddleSize (this will now reflect the new scale)
    const box = new THREE.Box3().setFromObject(playerPaddle);
    const paddleSize = {
        width: box.max.x - box.min.x,
        depth: box.max.z - box.min.z,
        height: box.max.y - box.min.y
    };

    // Assuming addMarkerToPaddle also needs the updated paddleSize and settings.debug
    addMarkerToPaddle(playerPaddle, paddleSize, "paddle-tip", settings.debug);
    //addMarkerToPaddle(aiPaddle, paddleSize, "ai-paddle-tip"); // If you uncomment this, pass settings.debug here too

    return { player: playerPaddle, ai: aiPaddle, size: paddleSize };
}

export const createBall = (scene, simulation, tableSize, paddleSize, scaleFactor = 1) => { // Add scaleFactor with default 1
    // Apply scaleFactor to the ballRadius calculation
    const ballRadius = paddleSize.width * 0.13 * scaleFactor; // <-- Apply scaleFactor here

    let ballGeometry = new THREE.SphereGeometry(ballRadius, 16, 16);
    let ballMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);

    // Set initial ball position (example: above player's side)
    // You might also want to adjust the initial Y position based on the new scale
    ball.position.set(0, tableSize.height * 2, tableSize.depth * 0.25);
    scene.add(ball);
    simulation.setBall(ball, ballRadius);

    return { object: ball, radius: ballRadius };
}


const addMarkerToPaddle = (paddle, paddleSize, name,debug) => {
    // this marker is to position the ball correctly when serving
    const childGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.02); // Small cube
    const childMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green color
    const childObject = new THREE.Mesh(childGeometry, childMaterial);
    childObject.name = name;
    if (!debug) {
        childObject.visible = false;
    }
    childObject.position.set(0, paddleSize.height, -paddleSize.depth / 2);

    paddle.add(childObject);
}
