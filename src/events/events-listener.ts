import { BehaviorSubject } from "rxjs";

export interface EventsListener {
  issues: BehaviorSubject<number[]>;
  start(): void;
  stop(): void;
}