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
import { CustomLogger } from 'src/utils/logger';
import {
  getReferralIDsFromTransactions,
  calculateReferralBalance,
} from 'src/utils/referrals';

@Processor('transaction')
export class TransactionWorker {
  private camPayService: CamPayAPI;
  private logger = new CustomLogger('TransactionWorker');

  constructor(private prismaService: PrismaService) {}

  @Process({ concurrency: 1 })
  async processTransaction(job: Job<TransactionDto & { userId: string }>) {
    try {
      this.logger.log('Processing job: ' + job.id);

      this.camPayService = await CamPayAPI.build();
      const user = await this.getUser(job.data.userId);

      if (job.data.motif === TransactionMotif.AppFee) {
        await this.processAppFee(user, job.data);
      } else {
        await this.processReferralTransaction(user, job.data);
      }
    } catch (error) {
      this.logger.error(error);
    }

    this.logger.log('Finished processing job: ' + job.id);
    return {};
  }

  private async getUser(userId: string) {
    return await this.prismaService.user.findUniqueOrThrow({
      where: { id: userId },
    });
  }

  private async userHasPayment(userId: string) {
    return await this.prismaService.transaction.findFirst({
      where: {
        userId: userId,
        status: Status.Success,
        motif: TransactionMotif.AppFee,
      },
    });
  }

  private async processAppFee(user: any, data: any) {
    const hasPayment = await this.userHasPayment(user.id);
    if (hasPayment) {
      this.logger.log('User already has payment ignoring');
      return;
    }

    const amount = process.env.APP_FEE || '50';
    let transaction: transaction;

    try {
      transaction = await this.createTransaction({
        amount,
        motif: data.motif,
        receiverPhoneNumber: process.env.ADMIN_PHONE,
        senderPhoneNumber: data.phoneNumber,
        type: TransactionType.Credit,
        userId: data.userId,
      });

      const reference = await this.processPaymentRequest(
        amount,
        transaction.id,
        data,
      );
      await this.updateTransactionReference(transaction.id, reference);
    } catch (error) {
      await this.handleTransactionFailure(transaction, error);
    }
  }

  private async processReferralTransaction(user: any, data: any) {
    const hasPayment = await this.userHasPayment(user.id);
    if (!hasPayment) {
      this.logger.warn("User don't have an active payment ignoring");
      return;
    }

    const transactionReferralIds = await getReferralIDsFromTransactions(
      data.userId,
    );
    const referralGain = await calculateReferralBalance(
      data.userId,
      MAX_DEPTH,
      transactionReferralIds,
    );
    const totalGain = Object.values(referralGain).reduce(
      (acc: number, currentValue: number) => acc + currentValue,
      0,
    ) as number;

    if (totalGain < 1) {
      this.logger.warn(`User total gain is ${totalGain} ignoring`);
      return;
    }

    const referralIds = Object.keys(referralGain).join(',');
    let transaction: transaction;

    try {
      transaction = await this.createTransaction({
        amount: String(totalGain),
        motif: data.motif,
        receiverPhoneNumber: data.phoneNumber,
        senderPhoneNumber: process.env.ADMIN_PHONE,
        type: TransactionType.Debit,
        userId: data.userId,
        referralIds: referralIds,
      });

      const reference = await this.processPaymentSend(
        totalGain,
        transaction.id,
        data,
      );
      await this.updateTransactionReference(transaction.id, reference);
    } catch (error) {
      await this.handleTransactionFailure(transaction, error);
    }
  }

  private async createTransaction(transactionData: any) {
    return await this.prismaService.transaction.create({
      data: transactionData,
    });
  }

  private async processPaymentRequest(
    amount: string,
    transactionId: string,
    data: any,
  ) {
    const paymentData = {
      amount,
      id: transactionId,
      message: data.motif,
      phoneNumber: data.phoneNumber,
    };
    const paymentResponse = await this.camPayService.requestToPay(paymentData);
    return paymentResponse.reference;
  }

  private async processPaymentSend(
    amount: number,
    transactionId: string,
    data: any,
  ) {
    const paymentData = {
      amount: String(amount),
      id: transactionId,
      message: data.motif,
      phoneNumber: data.phoneNumber,
    };
    const paymentResponse = await this.camPayService.sendTo(paymentData);
    return paymentResponse.reference;
  }

  private async updateTransactionReference(
    transactionId: string,
    reference: string,
  ) {
    await this.prismaService.transaction.update({
      where: { id: transactionId },
      data: { reference },
    });
  }

  private async handleTransactionFailure(
    transaction: transaction | undefined,
    error: any,
  ) {
    this.logger.error(error);
    if (transaction) {
      const errorDetails = error?.response
        ? JSON.stringify(error.response.data)
        : 'Transaction failed';
      await this.prismaService.transaction.update({
        where: { id: transaction.id },
        data: { status: Status.Failed, details: errorDetails },
      });
    }
  }
}
