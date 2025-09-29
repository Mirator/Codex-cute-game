export class FixedTime {
  private accumulator = 0;
  constructor(private readonly step: number) {}

  advance(delta: number, update: (step: number) => void): void {
    this.accumulator += delta;
    const maxFrame = this.step * 5;
    if (this.accumulator > maxFrame) {
      this.accumulator = maxFrame;
    }
    while (this.accumulator >= this.step) {
      update(this.step);
      this.accumulator -= this.step;
    }
  }

  reset(): void {
    this.accumulator = 0;
  }
}
