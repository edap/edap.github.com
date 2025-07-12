export function updateScoreUI(score) {
  const scoreDiv = document.getElementById('score');
  scoreDiv.textContent = `${score.player} : ${score.ai}`;
}

export function showWinLose(winner) {
  // TODO: Show win/lose message
}
