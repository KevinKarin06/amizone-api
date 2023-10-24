import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TransactionWorker } from './transaction-worker';
import { BullModule } from '@nestjs/bull';
import { QUEUE_LOCK_DURATION } from 'src/utils/constants';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'transaction',
      redis: {
        password: process.env.REDIS_PASSWORD,
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        maxRetriesPerRequest: 1,
      },
      settings: {
        lockDuration: QUEUE_LOCK_DURATION,
      },
    }),
  ],
  providers: [TransactionService, TransactionWorker],
  controllers: [TransactionController],
})
export class TransactionModule {}
