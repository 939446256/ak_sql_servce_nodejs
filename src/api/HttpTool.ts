
import axios from 'axios';
import { AxiosRequestConfig } from 'axios';

import { Injectable } from '@nestjs/common';

import { CacheService } from '../common/CacheService';



@Injectable()
export class HttpTool {

  constructor(private readonly cacheService: CacheService) {}

  async get(url) {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      const { msg, errorMsg } = error.response.data
      console.log('报错接口', url)
      throw new Error(`${errorMsg || msg}`);
    }
  }

  async post(url, body) {
    try {
      const response = await axios.post(url, body);
      return response.data;
    } catch (error) {
      const { msg, errorMsg } = error.response.data
      console.log('报错接口', url)
      throw new Error(`${errorMsg || msg}`);
    }
  }
  async postByConifg(url, body, config: AxiosRequestConfig) {
    try {
      const user = this.cacheService.get('user')
      console.log('Request parameters2:', user);
      const response = await axios.post(url, body, config);
      return response.data;
    } catch (error) {
      const { msg, errorMsg } = error.response.data
      console.log('报错接口', url)
      throw new Error(`${errorMsg || msg}`);
    }
  }
}
