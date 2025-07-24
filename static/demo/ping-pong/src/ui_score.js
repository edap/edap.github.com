export function updateScoreUI(score) {
  const scoreDiv = document.getElementById('score');
  scoreDiv.textContent = `You ${score.player} : AI ${score.ai}`;
}
