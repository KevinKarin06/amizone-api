import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { CamPayAPI } from './cam-pay-api';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionDto } from './transaction.dto';
import {
  MAX_DEPTH,
  Status,
  TransactionMotif,
  TransactionType,
} from 'src/utils/constants';
import { transaction } from '@prisma/client';
import {
  calculateReferralBalance,
  extractReferralIDsFromTransactions,
} from '../prisma/prisma-utils';

@Processor('transaction')
export class TransactionWorker {
  private camPayService: CamPayAPI;
  constructor(private prismaService: PrismaService) {}

  @Process({ concurrency: 1 })
  async processTransaction(job: Job<TransactionDto & { userId: string }>) {
    console.log('Processing job: ', job.id);
    this.camPayService = await CamPayAPI.build();
    const user = await this.prismaService.user.findUnique({
      where: { id: job.data.userId },
    });

    if (job.data.motif === TransactionMotif.AppFee) {
      if (user?.hasPayment) {
        return;
      }

      const amount = process.env.APP_FEE || '50';
      let transaction: transaction;

      try {
        transaction = await this.prismaService.transaction.create({
          data: {
            amount,
            motif: job.data.motif,
            receiverPhoneNumber: process.env.ADMIN_PHONE,
            senderPhoneNumber: job.data.phoneNumber,
            type: TransactionType.Credit,
            userId: job.data.userId,
          },
        });

        const data = await this.camPayService.requestToPay({
          amount,
          id: transaction.id,
          message: job.data.motif,
          phoneNumber: job.data.phoneNumber,
        });

        await this.prismaService.transaction.update({
          where: { id: transaction.id },
          data: {
            reference: data.reference,
          },
        });
      } catch (error) {
        if (transaction) {
          await this.prismaService.transaction.update({
            where: { id: transaction.id },
            data: {
              status: Status.Failed,
              details: error?.response
                ? JSON.stringify(error?.response?.data)
                : 'Transaction failed',
            },
          });
        }
      }
    } else {
      if (!user?.hasPayment) {
        return;
      }
      const transactionReferralIds = await extractReferralIDsFromTransactions(
        job.data.userId,
      );

      const referralGain = await calculateReferralBalance(
        job.data.userId,
        MAX_DEPTH,
        transactionReferralIds,
      );

      const totalGain = Object.values(referralGain).reduce(
        (acc: number, currentValue: number) => acc + currentValue,
        0,
      ) as number;

      if (totalGain < 1) {
        return;
      }

      const referralIds = Object.keys(referralGain).join(',');
      let transaction: transaction;

      try {
        transaction = await this.prismaService.transaction.create({
          data: {
            amount: String(totalGain),
            motif: job.data.motif,
            receiverPhoneNumber: job.data.phoneNumber,
            senderPhoneNumber: process.env.ADMIN_PHONE,
            type: TransactionType.Debit,
            userId: job.data.userId,
            referralIds: referralIds,
          },
        });

        const data = await this.camPayService.sendTo({
          amount: String(totalGain),
          id: transaction.id,
          message: job.data.motif,
          phoneNumber: job.data.phoneNumber,
        });

        await this.prismaService.transaction.update({
          where: { id: transaction.id },
          data: {
            reference: data.reference,
          },
        });
      } catch (error) {
        if (transaction) {
          await this.prismaService.transaction.update({
            where: { id: transaction.id },
            data: {
              status: Status.Failed,
              details: error?.response
                ? JSON.stringify(error?.response?.data)
                : 'Transaction failed',
            },
          });
        }
      }
    }
    return {};
  }
}
