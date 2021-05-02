import { DataLoaderInterface } from './data-loader-interface';
import { PeriodicInterface } from '../periodic/periodic-interface';
import * as Emittery from "emittery";

export abstract class DataLoaderBase implements DataLoaderInterface, PeriodicInterface {
  private interval = 10000;

  private timer: NodeJS.Timeout | null = null;

  issueChanged: Emittery<{issueChanged: number[]}> = new Emittery();

  start(): void {
    if (this.timer !== null) {
      return;
    }
    this.next();
  }

  next(): void {
    this.timer = setTimeout(() => {
      this.loadUpdates().then(this.next.bind(this));
    }, this.interval);
  }

  stop(): void {
    if (this.timer === null) {
      return;
    }
    clearTimeout(this.timer);
  }

  abstract loadUpdates(): Promise<number[]>;
}
