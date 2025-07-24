/* 
 * PingPongWebGL is licensed under MIT licensed. See LICENSE.md file for more information.
 * Copyright (c) 2014 MortimerGoro
*/

import * as THREE from "three"
import AudioManager from "./audio.js";

let linearVelocity = new THREE.Vector3(0, 0, 0);
let angularVelocity = new THREE.Vector3(0, 0, 0);
let ballRadius = 0;
const gravity = -4.8;
let prevGravity = 0;
let gravityTime = 0;
let restitution = 0.75;
let ballBoundingBox = new THREE.Box3();



class Physics {
    constructor() {
        this.ball = null;
        this.boxes = [];
        this.audio = new AudioManager();
        this.lastCollidedBoxName = null;
    }

    init(settings, randomSounds, ballSounds) {
        this.audio.init(settings,randomSounds, ballSounds);
    }

    addBox(b) {
        this.boxes.push(b);
    }

    setBall(ball, radius) {
        this.ball = ball;
        ballRadius = radius;
    }

    getLinearVelocity() {
        return linearVelocity;
    }

    hitBall(dir, force) {
        linearVelocity.set(dir.x, dir.y, dir.z);
        linearVelocity.multiplyScalar(force);
        prevGravity = 0;
        gravityTime = 0;
        this.audio.playPaddleSound();
    }

    simulate(step) {
        step = step || 1 / 60;


        gravityTime += step;
        var currentGravity = 0.1 * gravity * gravityTime * gravityTime;
        var vg = currentGravity - prevGravity;
        prevGravity = currentGravity;

        var ball = this.ball;

        ball.position.x += linearVelocity.x;
        ball.position.y += linearVelocity.y + vg;
        ball.position.z += linearVelocity.z;

        ballBoundingBox.setFromCenterAndSize(ball.position, new THREE.Vector3(ballRadius, ballRadius, ballRadius));

        for (var i = 0; i < this.boxes.length; ++i) {
            var box = this.boxes[i];
            if (this.isSphereIntersectingBox(box, ball.position, ballRadius)) {
                // if box.name == 'net', then the player (or the AI) has hit the net
                this.lastCollidedBoxName = box.name;
                this.collideBall(ball, box, vg);
            }
        }

    }

    isSphereIntersectingBox(box, sphere, radius) {
        var min = box.min;
        var max = box.max;
        var dmin = radius * radius;
        if (sphere.x < min.x) dmin -= Math.pow(sphere.x - min.x, 2);
        else if (sphere.x > max.x) dmin -= Math.pow(sphere.y - max.x, 2);
        if (sphere.y < min.y) dmin -= Math.pow(sphere.y - min.y, 2);
        else if (sphere.y > max.y) dmin -= Math.pow(sphere.y - max.y, 2);
        if (sphere.z < min.z) dmin -= Math.pow(sphere.z - min.z, 2);
        else if (sphere.z > max.z) dmin -= Math.pow(sphere.z - max.z, 2);
        return dmin > 0;
    }

    collideBall(ball, box, g) {

        var plane = new THREE.Plane();
        function sphereInterserctsPlane(nx, ny, nz, w, sphere, radius) {
            plane.setComponents(nx, ny, nz, w);
            return plane.distanceToPoint(sphere) <= radius;
        }

        var top = sphereInterserctsPlane(0, -1, 0, box.max.y, ball.position, ballRadius);
        var front = sphereInterserctsPlane(0, 0, -1, box.max.z, ball.position, ballRadius);
        //var bottom = sphereInterserctsPlane(0, 1, 0, -box.min.y, ball.position, ballRadius);
        var back = sphereInterserctsPlane(0, 0, 1, -box.min.z, ball.position, ballRadius);
        //var left = sphereInterserctsPlane(1, 0, 0, -box.min.x, ball.position, ballRadius);
        //var right = sphereInterserctsPlane(-1, 0, 0, box.max.x, ball.position, ballRadius);


        if (top) {
            ball.position.y = box.max.y + ballRadius;
            linearVelocity.y = -restitution * (linearVelocity.y + g);
            gravityTime = 0;
            prevGravity = 0;
        }
        // else if (bottom) {
        //     ball.position.y = box.min.y - ballRadius;
        //     linearVelocity.y = -restitution * (linearVelocity.y + g); // Gravity still applies to Y velocity
        //     gravityTime = 0;
        //     prevGravity = 0;
        // }

        if (front) {
            ball.position.z = box.max.z + ballRadius;
            linearVelocity.z *= -restitution;
        }
        else if (back) { // Added back collision
            ball.position.z = box.min.z - ballRadius;
            linearVelocity.z *= -restitution;
        }

        // if (left) { // Added left collision
        //     ball.position.x = box.min.x - ballRadius;
        //     linearVelocity.x *= -restitution;
        // }
        // else if (right) { // Added right collision
        //     ball.position.x = box.max.x + ballRadius;
        //     linearVelocity.x *= -restitution;
        // }

        //TODO: Angular velocity


        if (Math.abs(linearVelocity.y) > 0.001) {
            this.audio.playBallSound();
        }

    }
}

const calculatePaddleTrajectory = (paddleTrajectory) => {
    let now = Date.now();
    let trayectory = new THREE.Vector3(0, 0, 0);
    let prevT = null;
    for (let i = 0; i < paddleTrajectory.length; ++i) {
        let t = paddleTrajectory[i];
        if (now - t.time > 200) {
            continue; //we only check 200ms trayectory
        }
        if (!prevT) {
            prevT = t;
            continue;
        }
        trayectory.set(trayectory.x + t.x - prevT.x,
            trayectory.y + t.y - prevT.y,
            trayectory.z + t.z - prevT.z);
        prevT = t;
    }
    return trayectory;
}

export { Physics, calculatePaddleTrajectory};