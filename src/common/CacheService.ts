
import { Injectable } from '@nestjs/common';

var Cache = require('cache-base');


@Injectable()
export class CacheService {

  private cache = new Cache();

  async get(key: string): Promise<any> {
    return this.cache.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    this.cache.set(key, value);
  }
}