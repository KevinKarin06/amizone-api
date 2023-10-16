import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticationModule } from './core/authentication/authentication.module';
import { ExportModule } from './core/export/export.module';
import { FileModule } from './core/file/file.module';
import { NotificationModule } from './core/notification/notification.module';
import { TransactionModule } from './core/transaction/transaction.module';
import { UserModule } from './core/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './core/prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import { ProfileModule } from './core/profile/profile.module';

@Module({
  imports: [
    // BullModule.registerQueue({
    //   name: 'exports',
    //   redis: {
    //     password: process.env.REDIS_PASSWORD,
    //     host: process.env.REDIS_HOST,
    //     port: Number(process.env.REDIS_PORT),
    //   },
    //   settings: {
    //     lockDuration: QUEUE_LOCK_DURATION,
    //   },
    // }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_TOKEN,
      signOptions: { expiresIn: '7d' },
    }),
    EventEmitterModule.forRoot(),
    AuthenticationModule,
    ExportModule,
    FileModule,
    NotificationModule,
    TransactionModule,
    UserModule,
    PrismaModule,
    ProfileModule,
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
export class AppModule {}
