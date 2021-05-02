import { DataLoaderInterface } from './data-loader-interface';
import Emittery from "emittery";

export class ImapDataLoader implements DataLoaderInterface {
  async loadUpdates(): Promise<number[]> {
    console.log('ImapDataLoader.loadUpdates');
    return [];
  }

  issueChanged: Emittery<{ issueChanged: number[] }>;
}
