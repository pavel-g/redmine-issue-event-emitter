import { Injectable } from '@nestjs/common';

@Injectable()
export class DataLoaderService {
  loadUpdates() {
    console.log('loadUpdates');
  }
}
