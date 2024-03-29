import { NestFactory } from '@nestjs/core';
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { AppModule } from './app.module';

import { HttpException, HttpStatus } from '@nestjs/common';

import environment from'../environment';
const config = environment.currentEnv();


@Catch()
export class GlobalFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    // 统一处理异常，返回友好的错误信息
    console.log("统一处理异", exception.message)
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    // 返回一个错误响应
    response.status(202).json({
      statusCode: status,
      path: request.url,
      message: exception.message, // 或者其他合适的错误信息
    });
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 在main.ts中全局使用
  if(config.currentMode != '测试模式'){
    app.useGlobalFilters(new GlobalFilter());
  }
  await app.listen(8830);
}
bootstrap();
