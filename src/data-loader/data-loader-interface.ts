import Emittery from "emittery";

export interface DataLoaderInterface {
  issueChanged: Emittery<{issueChanged: number[]}>;
  loadUpdates(): Promise<number[]>;
}
