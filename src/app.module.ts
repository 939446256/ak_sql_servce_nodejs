import { Module, MiddlewareConsumer } from '@nestjs/common';
import { reportStatisticsController } from './controller/bussiness/reportStatistics.controller';
import { SqlController } from './controller/base/sql.controller';
import { shutDownDeviceWagesController } from './controller/bussiness/shutDownDeviceWages.controller';
import { bomController } from './controller/bussiness/bom.controller';
import { LoggingMiddleware } from './filter/LoggingMiddleware';
import { CacheService } from './common/CacheService';
import { HttpTool } from './api/HttpTool';
import { orderController } from './controller/bussiness/order.controller';

@Module({
  imports: [],
  controllers: [
    // 基础javaSQL接口
    SqlController,
    // 报表接口
    reportStatisticsController,
    // 停机工资
    shutDownDeviceWagesController,
    // bom表
    bomController,
    // 订单
    orderController
  ],
  providers: [HttpTool, LoggingMiddleware, CacheService],
  // providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
