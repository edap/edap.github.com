/* 
 * PingPongWebGL is licensed under MIT licensed. See LICENSE.md file for more information.
 * Copyright (c) 2014 Imanol Fernandez @MortimerGoro
*/
import { Vector3 } from "three"


let targetPos = new Vector3(0, 0, 0);

class AI {
    constructor(simulation, tableSize, paddle, paddleSize, ball, ballRadius) {
        this.simulation = simulation;
        this.tableSize = tableSize;
        this.paddle = paddle;
        this.paddleSize = paddleSize;
        this.ball = ball;
        this.ballRadius = ballRadius;
        this.speed = 0.35;  // Reduced from 0.5 - slower paddle movement
        this.force = 0.4;   // Reduced from 0.5 - less powerful hits
        this.difficulty = 'normal'; // normal, easy, hard
        this.errorRate = 0.15; // 15% chance of imperfect positioning
    }


    setSpeed(speed) {
        this.speed = speed;
    }

    setForce(force) {
        this.force = force;
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        switch (difficulty) {
            case 'easy':
                this.speed = 0.25;
                this.force = 0.3;
                this.errorRate = 0.25; // 25% chance of mistakes
                break;
            case 'normal':
                this.speed = 0.35;
                this.force = 0.4;
                this.errorRate = 0.15; // 15% chance of mistakes
                break;
            case 'hard':
                this.speed = 0.6;
                this.force = 0.7;
                this.errorRate = 0.05; // 5% chance of mistakes
                break;
        }
    }

    play() {
        let myPos = this.paddle.position;
        let ballPos = this.ball.position
        let paddleSize = this.paddleSize;
        let tableSize = this.tableSize;

        if (this.simulation.getLinearVelocity().z > 0) {
            //ball going against opponent
            targetPos.set(0, tableSize.height, -tableSize.depth * 0.5);
        }
        else {
            let targetX = ballPos.x;
            targetPos.set(targetX, tableSize.height, -tableSize.depth * 0.5);

            let hitting = false;
            let hit = false;

            let zDistance = Math.abs(myPos.z - ballPos.z);
            let xDistance = Math.abs(myPos.x - ballPos.x);
            let yDistance = myPos.y - ballPos.y;

            // Slightly less generous hit detection to make AI more realistic
            hit = zDistance < tableSize.depth * 0.04 && xDistance < paddleSize.width * 0.9 && Math.abs(yDistance) < paddleSize.height * 0.7;
            hitting = zDistance < tableSize.depth * 0.18 && xDistance < paddleSize.width;

            if (hitting) {
                targetPos.y = ballPos.y;
            }

            if (hit) {
                // Sometimes AI makes hitting mistakes
                let makeMistake = Math.random() < this.errorRate * 0.5; // Half the error rate for hitting mistakes

                let dir = new Vector3(0, 0, 0);
                //fixed z
                dir.z = 1.0;
                console.log("called")
                let hitForce;
                if (makeMistake) {
                    // Mistake: Poor angle or timing
                    dir.y = 0.1 + Math.random() * 0.4; // More letiable height
                    let rx = Math.random() * tableSize.width * 0.8; // Less precise targeting
                    rx *= Math.random() > 0.5 ? 1 : -1;
                    let dirAngle = Math.atan2(-tableSize.depth + ballPos.z, rx - myPos.x);
                    dir.x = Math.cos(dirAngle);
                    dir.x = Math.min(Math.abs(dir.x), 0.7) * (dir.x > 0 ? 1 : -1); // Can hit wider
                    hitForce = 0.015 + this.force * 0.015 * Math.random(); // Weaker hit on mistake
                } else {
                    // Normal hit - but still not perfect
                    dir.y = 0.2 + Math.random() * 0.25;
                    let rx = Math.random() * tableSize.width * 0.6; // Slightly less precise than before
                    rx *= Math.random() > 0.5 ? 1 : -1;
                    let dirAngle = Math.atan2(-tableSize.depth + ballPos.z, rx - myPos.x);
                    dir.x = Math.cos(dirAngle);
                    dir.x = Math.min(Math.abs(dir.x), 0.5) * (dir.x > 0 ? 1 : -1);
                    hitForce = 0.02 + this.force * 0.02 * Math.random();
                }

                this.simulation.hitBall(dir, hitForce);

                // Track that AI hit the ball for realistic scoring
                if (typeof lastHitter !== 'undefined') {
                    lastHitter = 'ai';
                    ballBouncedOnOpponentSide = false; // Reset bounce tracking
                    ballHitTable = false; // Reset table hit tracking

                    // TODO, check if needed
                    // if (typeof PingPong !== 'undefined' && PingPong.MobileDebug) {
                    //     PingPong.MobileDebug.log('🤖 AI HIT BALL - lastHitter set to ai');
                    // }
                }
            }
        }

        let diffY = myPos.y - Math.max(targetPos.y, tableSize.height * 0.8);
        //myPos.y+= Math.min(Math.abs(diffY), paddleSize.height* 0.1) * (diffY ? -1 : 1);

        let diffX = Math.abs(targetPos.x - myPos.x);
        let speedX = tableSize.width * 0.04 * this.speed; // Reduced from 0.05 - slower movement

        // Add slight movement imperfection
        let movementAccuracy = 1.0;
        if (Math.random() < this.errorRate * 0.3) {
            movementAccuracy = 0.7 + Math.random() * 0.3; // Sometimes move at 70-100% efficiency
        }

        myPos.x += Math.min(diffX, speedX * movementAccuracy) * (myPos.x > targetPos.x ? -1 : 1);
    }
}

export default AI;
