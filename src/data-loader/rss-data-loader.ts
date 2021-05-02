import { DataLoaderInterface } from './data-loader-interface';
import Emittery from "emittery";

export class RssDataLoader implements DataLoaderInterface {
  async loadUpdates(): Promise<number[]> {
    console.log('RssDataLoader.loadUpdates');
    return [];
  }

  issueChanged: Emittery<{ issueChanged: number[] }>;
}
