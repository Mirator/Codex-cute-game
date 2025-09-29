interface SummaryPayload {
  score: number;
  combo: number;
  heat: number;
}

const BEST_SCORE_KEY = 'mischief-cat-best-score';

export class Hud {
  private readonly scoreValue = document.getElementById('scoreValue') as HTMLElement;
  private readonly comboFill = document.getElementById('comboFill') as HTMLElement;
  private readonly comboLabel = document.getElementById('comboLabel') as HTMLElement;
  private readonly heatFill = document.getElementById('heatFill') as HTMLElement;
  private readonly heatLabel = document.getElementById('heatLabel') as HTMLElement;
  private readonly prompts = document.getElementById('prompts') as HTMLElement;
  private readonly summary = document.getElementById('summary') as HTMLElement;
  private readonly summaryScore = document.getElementById('summaryScore') as HTMLElement;
  private readonly summaryCombo = document.getElementById('summaryCombo') as HTMLElement;
  private readonly summaryHeat = document.getElementById('summaryHeat') as HTMLElement;
  private readonly summaryRestart = document.getElementById('summaryRestart') as HTMLButtonElement;
  private readonly bestScoreLabel = document.getElementById('bestScore') as HTMLElement;
  onRestart?: () => void;

  constructor() {
    this.summaryRestart.addEventListener('click', () => {
      this.summary.classList.remove('visible');
      this.onRestart?.();
    });
    const best = this.bestScore;
    if (best > 0) {
      this.bestScoreLabel.textContent = `Best ${best.toLocaleString()}`;
    }
  }

  private get bestScore(): number {
    const stored = localStorage.getItem(BEST_SCORE_KEY);
    return stored ? Number(stored) : 0;
  }

  private set bestScore(value: number) {
    localStorage.setItem(BEST_SCORE_KEY, value.toString());
    this.bestScoreLabel.textContent = `Best ${value.toLocaleString()}`;
  }

  setScore(score: number): void {
    this.scoreValue.textContent = score.toLocaleString();
    if (score > this.bestScore) {
      this.bestScore = score;
    }
  }

  setCombo(combo: number, progress: number, multiplier: number): void {
    this.comboLabel.textContent = `x${multiplier.toFixed(2)}`;
    this.comboFill.style.width = `${Math.min(progress, 1) * 100}%`;
    this.comboFill.style.background = combo >= 5 ? 'linear-gradient(90deg,#ff9a9e,#fad0c4)' : 'linear-gradient(90deg,#7ce3ff,#fe9eff)';
  }

  setHeat(percent: number, label: string): void {
    this.heatFill.style.width = `${Math.min(percent, 1) * 100}%`;
    this.heatLabel.textContent = label;
    this.heatLabel.classList.toggle('alert', label === 'Alert');
    this.heatLabel.classList.toggle('chasing', label === 'Chasing');
  }

  showPrompt(text: string): void {
    this.prompts.textContent = text;
    this.prompts.classList.add('visible');
  }

  hidePrompt(): void {
    this.prompts.classList.remove('visible');
  }

  showSummary(payload: SummaryPayload): void {
    this.summaryScore.textContent = `Score: ${payload.score.toLocaleString()}`;
    this.summaryCombo.textContent = `Max combo: ${payload.combo.toFixed(0)}`;
    this.summaryHeat.textContent = `Peak heat: ${payload.heat.toFixed(0)}`;
    this.summary.classList.add('visible');
  }
}
