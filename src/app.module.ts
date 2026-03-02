import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core/constants';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { CatalogModule } from './catalog/catalog.module';
import { CategoriesService } from './categories/categories.service';
import { HealthController } from './health/health.controller';
import { HealthModule } from './health/health.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma.module';
import { PrismaService } from './prisma.service';
import { ReportsModule } from './reports/reports.module';
import { StudentsModule } from './students/students.module';
import { TenantMiddleware } from './tenant.middleware';
import { TenantsModule } from './tenants/tenants.module';
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
    StudentsModule,
    TenantsModule,
    ThrottlerModule.forRoot([
      {
        ttl: 15 * 60 * 1000,
        limit: 100,
      },
    ]),
    HealthModule,
    ...(process.env.ENABLE_TEST_ENDPOINTS === 'true' ? [TestsModule] : []),
  ],
  controllers: [AppController, AuthController, HealthController],
  providers: [
    AppService,
    AuthService,
    PrismaService,
    CategoriesService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes(AuthController);
  }
}
