// game_rules.js
import * as THREE from 'three'; // Import if any functions internally use THREE (like Vector3, Box3 if needed later)

/**
 * Checks if the ball has hit the table and updates bounce state.
 * @param {THREE.Mesh} ball - The ball object.
 * @param {object} tableSize - Dimensions of the table.
 * @param {number} ballRadius - Radius of the ball.
 * @param {string|null} lastHitter - 'player' or 'ai' indicating who last hit the ball.
 * @param {boolean} ballHitTable - Current state if ball has hit table.
 * @returns {object} Updated state: { ballHitTable: boolean, ballBouncedOnOpponentSide: boolean }
 */
export const checkBallHitTable = (ball, tableSize, ballRadius, lastHitter, ballHitTable) => {
    let updatedBallHitTable = ballHitTable;
    let updatedBallBouncedOnOpponentSide = false;

    let ballNearTable = Math.abs(ball.position.y - tableSize.height) < ballRadius * 2 &&
        Math.abs(ball.position.x) < tableSize.width * 0.5 &&
        Math.abs(ball.position.z) < tableSize.depth * 0.5;

    if (ballNearTable && !ballHitTable) {
        updatedBallHitTable = true;
        // Check which side the ball bounced on relative to its current Z position
        if (ball.position.z > 0) {
            if (lastHitter === 'ai') {
                updatedBallBouncedOnOpponentSide = true;
            }
        } else { // On AI's side of the table
            if (lastHitter === 'player') {
                updatedBallBouncedOnOpponentSide = true;
            }
        }
    }
    return { ballHitTable: updatedBallHitTable, ballBouncedOnOpponentSide: updatedBallBouncedOnOpponentSide };
};

/**
 * Checks if the ball went off the side of the table.
 * @param {THREE.Mesh} ball - The ball object.
 * @param {object} tableSize - Dimensions of the table.
 * @returns {boolean} True if ball is off side.
 */
export const isBallOffSide = (ball, tableSize) => {
    return Math.abs(ball.position.x) > tableSize.width * 0.6;
};

/**
 * Checks if the ball fell below the table.
 * @param {THREE.Mesh} ball - The ball object.
 * @param {object} tableSize - Dimensions of the table.
 * @returns {boolean} True if ball is below table.
 */
export const isBallBelowTable = (ball, tableSize) => {
    return ball.position.y < tableSize.height * 0.3;
};

/**
 * Checks if the ball went past the player's boundary.
 * @param {THREE.Mesh} ball - The ball object.
 * @param {object} tableSize - Dimensions of the table.
 * @returns {boolean} True if ball is past player's boundary.
 */
export const isBallPastPlayerBoundary = (ball, tableSize) => {
    return ball.position.z > tableSize.depth * 0.7;
};

/**
 * Checks if the ball went past the AI's boundary.
 * @param {THREE.Mesh} ball - The ball object.
 * @param {object} tableSize - Dimensions of the table.
 * @returns {boolean} True if ball is past AI's boundary.
 */
export const isBallPastAIBoundary = (ball, tableSize) => {
    return ball.position.z < -tableSize.depth * 0.7;
};

/**
 * Determines who scored based on game rules.
 * @param {string|null} lastHitter - 'player' or 'ai' indicating who last hit the ball.
 * @param {boolean} ballBouncedOnOpponentSide - True if the ball bounced on the opponent's side.
 * @param {number} ballZPosition - The Z-coordinate of the ball.
 * @returns {string|null} 'player', 'ai', or null if no clear scorer yet.
 */
export const determineScorer = (lastHitter, ballBouncedOnOpponentSide, ballZPosition) => {
    if (lastHitter === 'player') {
        if (!ballBouncedOnOpponentSide) {
            return 'ai';
        } else {
            return 'player';
        }
    } else if (lastHitter === 'ai') {
        if (!ballBouncedOnOpponentSide) {
            return 'player';
        } else {
            return 'ai';
        }
    } else {
        // Fallback for cases where lastHitter is null (e.g., first serve fault, or unhandled scenario)
        // If ball is on player's side, AI scores. If on AI's side, player scores.
        if (ballZPosition > 0) {
            return 'ai';
        } else {
            return 'player';
        }
    }
};