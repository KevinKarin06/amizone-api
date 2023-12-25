import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticationModule } from './core/auth/authentication.module';
import { ExportModule } from './core/export/export.module';
import { NotificationModule } from './core/notification/notification.module';
import { TransactionModule } from './core/transaction/transaction.module';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './core/prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import { UserModule } from './core/user/user.module';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_TOKEN,
      signOptions: { expiresIn: '7d' },
    }),
    EventEmitterModule.forRoot(),
    AuthenticationModule,
    ExportModule,
    NotificationModule,
    TransactionModule,
    PrismaModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
