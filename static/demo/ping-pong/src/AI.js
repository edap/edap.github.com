import { Vector3 } from "three"

let targetPos = new Vector3(0, 0, 0);

class AI {
    constructor(simulation, tableSize, paddle, paddleSize, ball, ballRadius,setLastHitterCallback) {
        this.simulation = simulation;
        this.tableSize = tableSize;
        this.paddle = paddle;
        this.paddleSize = paddleSize;
        this.ball = ball;
        this.ballRadius = ballRadius;
        this.speed = 0.35;
        this.force = 0.4;
        this.difficulty = 'normal';
        this.errorRate = 0.15;
        this.setLastHitterCallback = setLastHitterCallback;
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
                this.errorRate = 0.25;
                break;
            case 'normal':
                this.speed = 0.35;
                this.force = 0.4;
                this.errorRate = 0.15;
                break;
            case 'hard':
                this.speed = 0.6;
                this.force = 0.7;
                this.errorRate = 0.05;
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
                let hitForce;

                // Adjust vertical direction (dir.y) based on ball height and difficulty
                let baseDirY = 0.3; // A more robust starting point for y
                
                // If ball is lower than table height, aim for a higher trajectory
                if (ballPos.y < tableSize.height) { 
                    baseDirY = 0.4; // Give it more upward push when ball is low
                }
                
                // Apply difficulty adjustments to baseDirY
                switch (this.difficulty) {
                    case 'easy':
                        baseDirY = Math.max(0.25, baseDirY - 0.1); // Can be a bit lower, allowing for more net hits
                        break;
                    case 'hard':
                        baseDirY = Math.min(0.5, baseDirY + 0.05); // Aim a bit higher for more reliable clears
                        break;
                }

                if (makeMistake) {
                    // Mistake: Poor angle or timing, still allow for some net hits, but less often
                    // Range will be (baseDirY - 0.1) to (baseDirY - 0.1 + 0.3)
                    dir.y = (baseDirY - 0.1) + Math.random() * 0.3; 
                    dir.y = Math.max(dir.y, 0.2); // Ensure a minimum lift even on a mistake, prevent too many net hits
                    
                    let rx = Math.random() * tableSize.width * 0.8; // Less precise targeting for x
                    rx *= Math.random() > 0.5 ? 1 : -1;
                    let dirAngle = Math.atan2(-tableSize.depth + ballPos.z, rx - myPos.x);
                    dir.x = Math.cos(dirAngle);
                    dir.x = Math.min(Math.abs(dir.x), 0.7) * (dir.x > 0 ? 1 : -1); // Can hit wider
                    hitForce = 0.015 + this.force * 0.015 * Math.random(); // Weaker hit on mistake
                } else {
                    // Normal hit - improved vertical control
                    // Range will be baseDirY to (baseDirY + 0.2)
                    dir.y = baseDirY + Math.random() * 0.2; 
                    
                    let rx = Math.random() * tableSize.width * 0.6; // Slightly less precise than before
                    rx *= Math.random() > 0.5 ? 1 : -1;
                    let dirAngle = Math.atan2(-tableSize.depth + ballPos.z, rx - myPos.x);
                    dir.x = Math.cos(dirAngle);
                    dir.x = Math.min(Math.abs(dir.x), 0.5) * (dir.x > 0 ? 1 : -1);
                    hitForce = 0.02 + this.force * 0.02 * Math.random();
                }

                this.simulation.hitBall(dir, hitForce);

                // Track that AI hit the ball for realistic scoring
                this.setLastHitterCallback('ai'); 
            }
        }

        let diffY = myPos.y - Math.max(targetPos.y, tableSize.height * 0.8);
        //myPos.y+= Math.min(Math.abs(diffY), paddleSize.height* 0.1) * (diffY ? -1 : 1);

        let diffX = Math.abs(targetPos.x - myPos.x);
        let speedX = tableSize.width * 0.04 * this.speed;

        // Add slight movement imperfection
        let movementAccuracy = 1.0;
        if (Math.random() < this.errorRate * 0.3) {
            movementAccuracy = 0.7 + Math.random() * 0.3;
        }

        myPos.x += Math.min(diffX, speedX * movementAccuracy) * (myPos.x > targetPos.x ? -1 : 1);
    }
}

export default AI;
