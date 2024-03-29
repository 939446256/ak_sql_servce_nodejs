import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

import { CacheService } from '../common/CacheService';



@Injectable()
export class LoggingMiddleware implements NestMiddleware {



  constructor(private readonly cacheService: CacheService) {}



  async use(request: Request, res: Response, next: Function) {
    const u = await this.cacheService.get('user');
    console.log('Request parameters:', await this.cacheService.get('user'));
    if(!u) {
      await this.cacheService.set('user', request.headers["context-employee-id"])
    }
    next();
  }
}