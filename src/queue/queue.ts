import { Subject } from "rxjs";

export class Queue<T> {

  private items: T[] = [];

  queue: Subject<T[]> = new Subject<T[]>();

  constructor(private updateInterval: number, private itemsLimit: number) {}

  add(values: T[]): void {
    this.items.push(...values);
  }

  start(): void {
    this.update();
  }

  stop(): void {
    clearTimeout(this.updateTimeout);
    this.updateTimeout = null;
  }

  private updateTimeout;

  private update(): void {
    if (this.items.length > 0) {
      const items = this.items.splice(0, this.itemsLimit);
      this.queue.next(items)
    }
    this.updateTimeout = setTimeout(() => {
      this.update();
    }, this.updateInterval);
  }

}