import { DataLoaderBase } from './data-loader-base';

export class RandomDataLoader extends DataLoaderBase {
  async loadUpdates(): Promise<number[]> {
    const count = this.randomInteger(1, 5);
    const res: number[] = [];
    for (let i = 0; i < count; i++) {
      res.push(this.randomInteger(100000, 999999));
    }
    if (res.length > 0) {
      await this.issueChanged.emit('issueChanged', res)
    }
    return res;
  }

  private randomInteger(min: number, max: number): number {
    const rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
  }
}
