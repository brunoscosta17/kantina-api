import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core/constants';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { CategoriesService } from './categories/categories.service';
import { HealthModule } from './health/health.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma.module';
import { ReportsModule } from './reports/reports.module';
import { TenantMiddleware } from './tenant.middleware';
import { TestsModule } from './tests/tests.module';
import { WalletsModule } from './wallets/wallets.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CatalogModule,
    WalletsModule,
    OrdersModule,
    ReportsModule,
    ThrottlerModule.forRoot([
      {
        ttl: 15 * 60 * 1000,
        limit: 100,
      },
    ]),
    HealthModule,
    ...(process.env.NODE_ENV === 'production' ? [] : [TestsModule]),
  ],
  controllers: [AppController],
  providers: [AppService, CategoriesService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes({ path: 'auth/(.*)', method: RequestMethod.ALL });
  }
}
