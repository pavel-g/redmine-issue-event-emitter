import { Injectable } from '@nestjs/common';
import { RandomDataLoader } from './random-data-loader';
import { DataLoaderBase } from './data-loader-base';

@Injectable()
export class DataLoaderService {
  loader: DataLoaderBase = new RandomDataLoader();
  constructor() {
    this.loader.start();
  }
}
