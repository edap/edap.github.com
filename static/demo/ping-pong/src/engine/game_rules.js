export const checkBallHitTable = (ball, tableSize, ballRadius, lastHitter, ballHitTable) => {
    let updatedBallHitTable = ballHitTable;
    let updatedBallBouncedOnOpponentSide = false;

    let ballNearTable = Math.abs(ball.position.y - tableSize.height) < ballRadius * 2 &&
        Math.abs(ball.position.x) < tableSize.width * 0.5 &&
        Math.abs(ball.position.z) < tableSize.depth * 0.5;

    if (ballNearTable && !ballHitTable) {
        updatedBallHitTable = true;

        if (ball.position.z > 0) {
            if (lastHitter === 'ai') {
                updatedBallBouncedOnOpponentSide = true;
            }
        } else {
            if (lastHitter === 'player') {
                updatedBallBouncedOnOpponentSide = true;
            }
        }
    }
    return { ballHitTable: updatedBallHitTable, ballBouncedOnOpponentSide: updatedBallBouncedOnOpponentSide };
};

export const isBallOffSide = (ball, tableSize) => {
    return Math.abs(ball.position.x) > tableSize.width * 0.6;
};

export const isBallBelowTable = (ball, tableSize) => {
    return ball.position.y < tableSize.height * 0.3;
};

export const isBallPastPlayerBoundary = (ball, tableSize) => {
    return ball.position.z > tableSize.depth * 0.7;
};

export const isBallPastAIBoundary = (ball, tableSize) => {
    return ball.position.z < -tableSize.depth * 0.7;
};

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