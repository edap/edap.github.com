import { DISAPPEAR_REASON_FOR_POINT_DELAY } from "./constants.js";

let reasonForPointTimeoutId;
let playerScoreAnimationTimeoutId;
let aiScoreAnimationTimeoutId;


export function updateScoreUI(newScore, oldScore) { // Added oldScore parameter
  const scoreDiv = document.getElementById('score');
  scoreDiv.textContent = `You ${newScore.player} : AI ${newScore.ai}`;

  // Find the specific text nodes or create spans if needed for more precise animation
  // For simplicity, we'll animate the whole score div's text content.
  // If you need to animate "You" and "AI" parts independently, you'd need separate spans in HTML.

  // Determine which player scored
  if (oldScore) { // Only animate if an oldScore is provided
    if (newScore.player > oldScore.player) {
      // Player scored
      scoreDiv.classList.add('player-score-point');
      // Clear any existing animation timeout for player
      if (playerScoreAnimationTimeoutId) {
        clearTimeout(playerScoreAnimationTimeoutId);
      }
      playerScoreAnimationTimeoutId = setTimeout(() => {
        scoreDiv.classList.remove('player-score-point');
      }, 500); // Animation lasts 0.5 seconds (adjust this duration to match your CSS transition or desired effect)
    } else if (newScore.ai > oldScore.ai) {
      // AI scored
      scoreDiv.classList.add('ai-score-point');
      // Clear any existing animation timeout for AI
      if (aiScoreAnimationTimeoutId) {
        clearTimeout(aiScoreAnimationTimeoutId);
      }
      aiScoreAnimationTimeoutId = setTimeout(() => {
        scoreDiv.classList.remove('ai-score-point');
      }, 500); // Animation lasts 0.5 seconds
    }
  }
}

export function getCurrentScoreFromHTML() {
  const scoreDiv = document.getElementById('score');
  if (scoreDiv && scoreDiv.textContent) {
    const text = scoreDiv.textContent;
    // Use a regular expression to extract numbers after "You" and "AI"
    const match = text.match(/You (\d+) : AI (\d+)/);
    if (match && match.length === 3) {
      const player = parseInt(match[1], 10);
      const ai = parseInt(match[2], 10);
      return { player, ai };
    }
  }
  // Return default score if element not found or parsing fails
  return { player: 0, ai: 0 };
}

export function updateReasonForPointUI(reason) {
  const reasonDiv = document.querySelector('.reason-for-point');

  if (reasonDiv) {
    if (reasonForPointTimeoutId) {
      clearTimeout(reasonForPointTimeoutId);
    }

    reasonDiv.textContent = reason;

    reasonForPointTimeoutId = setTimeout(() => {
      reasonDiv.textContent = '';
    }, DISAPPEAR_REASON_FOR_POINT_DELAY);
  }
}
