import { Subject } from "rxjs";

export class Queue<T, NT> {

  private items: T[] = [];

  queue: Subject<NT[]> = new Subject<NT[]>();

  constructor(
    private updateInterval: number,
    private itemsLimit: number,
    private transformationFn: ((arg: Array<T>) => Promise<Array<NT>>)
  ) {}

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

  private async update(): Promise<void> {
    if (this.items.length > 0) {
      const items = this.items.splice(0, this.itemsLimit);
      const transformedItems = await this.transformationFn(items);
      this.queue.next(transformedItems);
    }
    this.updateTimeout = setTimeout(() => {
      this.update();
    }, this.updateInterval);
  }

}