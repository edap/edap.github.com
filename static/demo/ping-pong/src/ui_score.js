import { DISAPPEAR_REASON_FOR_POINT_DELAY, UPDATE_SCORE_DELAY } from "./constants.js";

let reasonForPointTimeoutId;
let playerScoreAnimationTimeoutId;
let aiScoreAnimationTimeoutId;


export function updateScoreUI(newScore, oldScore) {
  const playerScoreSpan = document.getElementById('player-score');
  const aiScoreSpan = document.getElementById('ai-score');

  if (!playerScoreSpan || !aiScoreSpan) {
    console.warn('Score spans not found. Cannot update score UI.');
    return;
  }

  playerScoreSpan.textContent = newScore.player;
  aiScoreSpan.textContent = newScore.ai;

  if (oldScore) {
    if (newScore.player > oldScore.player) {
      playerScoreSpan.classList.add('player-score-point-anim');

      if (playerScoreAnimationTimeoutId) {
        clearTimeout(playerScoreAnimationTimeoutId);
      }
      playerScoreAnimationTimeoutId = setTimeout(() => {
        playerScoreSpan.classList.remove('player-score-point-anim');
      }, UPDATE_SCORE_DELAY);
    } else if (newScore.ai > oldScore.ai) {
      aiScoreSpan.classList.add('ai-score-point-anim');

      if (aiScoreAnimationTimeoutId) {
        clearTimeout(aiScoreAnimationTimeoutId);
      }
      aiScoreAnimationTimeoutId = setTimeout(() => {
        aiScoreSpan.classList.remove('ai-score-point-anim');
      }, UPDATE_SCORE_DELAY);
    }
  }
}
export function getCurrentScoreFromHTML() {
  const playerScoreSpan = document.getElementById('player-score');
  const aiScoreSpan = document.getElementById('ai-score');

  if (playerScoreSpan && aiScoreSpan) {
    const player = parseInt(playerScoreSpan.textContent, 10);
    const ai = parseInt(aiScoreSpan.textContent, 10);
    return { player, ai };
  }

  console.warn('Warning: #player-score or #ai-score elements not found. Returning default score.');
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
