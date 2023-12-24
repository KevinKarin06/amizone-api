import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { TransactionData, TransactionDto } from './transaction.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ApiResponse } from 'src/types/response';
import { transaction, user } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Status, TransactionMotif } from 'src/utils/constants';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CamPayAPI } from './cam-pay-api';
import { isDateOlderThanHours } from 'src/utils/misc';

@Injectable()
export class TransactionService {
  constructor(
    @InjectQueue('transaction') private queueService: Queue,
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  async getTransactions(
    queryParams: Record<string, any>,
    authUser: user,
  ): Promise<ApiResponse<transaction[]> | HttpException> {
    const { pagination, filters } = queryParams;

    const transactions = await this.prismaService.transaction.findMany({
      where: {
        ...filters,
        userId: authUser.isAdmin ? undefined : authUser.id,
      },
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { createdAt: 'desc' },
    });

    return new ApiResponse({ data: transactions, statusCode: 200 });
  }

  async initializeTransaction(
    data: TransactionDto,
    authUser: user,
  ): Promise<ApiResponse<any> | HttpException> {
    const transaction = await this.prismaService.transaction.findFirst({
      where: {
        userId: authUser.id,
        status: Status.Success,
        motif: TransactionMotif.AppFee,
      },
    });

    if (transaction && transaction.motif === data.motif) {
      throw new ConflictException('App fee already paid');
    }

    if (data.motif === TransactionMotif.ReferralGain && !authUser.hasPayment) {
      throw new BadRequestException(
        'Cannot withdraw without an active payment',
      );
    }

    try {
      await this.queueService.add(
        { ...data, userId: authUser.id },
        {
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
    } catch (error) {
      throw new HttpException(
        'Cannot process transaction',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return new ApiResponse({ data: {}, statusCode: 201 });
  }

  async getTotalMonthlyTransactionsByMotif(
    motif: TransactionMotif,
    year: string,
  ): Promise<ApiResponse<any> | HttpException> {
    const result: any = await this.prismaService.$queryRaw`
    SELECT 
      YEAR(createdAt) as year,
      MONTH(createdAt) as month,
      SUM(amount) as sum
    FROM transaction
    WHERE motif = ${motif}
      AND status = ${Status.Success}
      AND YEAR(createdAt) = ${year}
    GROUP BY YEAR(createdAt), MONTH(createdAt)
  `;

    return new ApiResponse({ data: result, statusCode: 200 });
  }

  async getTotalTransactionsByMotif(
    motif: TransactionMotif,
  ): Promise<ApiResponse<number> | HttpException> {
    const result: any = await this.prismaService.$queryRaw`
         SELECT SUM(amount) AS sum
         FROM transaction
         WHERE motif = ${motif}
         AND status = ${Status.Success}`;

    return new ApiResponse({ data: result[0].sum || 0, statusCode: 200 });
  }

  async calculateTotalRevenue(): Promise<ApiResponse<number> | HttpException> {
    const totalEarned: any = await this.getTotalTransactionsByMotif(
      TransactionMotif.AppFee,
    );

    const totalWithdrawn: any = await this.getTotalTransactionsByMotif(
      TransactionMotif.ReferralGain,
    );

    // const totalWaitingToBeWithdrawn = 0;

    const totalRevenue = totalEarned.data - totalWithdrawn.data;

    return new ApiResponse({ data: totalRevenue, statusCode: 200 });
  }

  async onTransactionComplete(data: TransactionData) {
    try {
      await this.jwtService.verifyAsync(data.signature, {
        secret: process.env.CAM_PAY_WEBHOOK_SECRET,
      });

      const transaction = await this.prismaService.transaction.findUnique({
        where: { id: data.external_reference },
      });

      if (transaction && transaction.status === Status.Pending) {
        const updated = await this.prismaService.transaction.update({
          where: { id: transaction.id },
          data: { status: data.status },
        });

        if (
          updated.motif === TransactionMotif.AppFee &&
          updated.status === Status.Success
        ) {
          await this.prismaService.user.update({
            where: { id: updated.userId },
            data: { hasPayment: true },
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async clearPendingTransactions() {
    const pendingTransactions = await this.prismaService.transaction.findMany({
      where: { status: Status.Pending },
    });

    for (const t of pendingTransactions) {
      try {
        const camPayService = await CamPayAPI.build();
        const remoteTransaction = await camPayService.getTransaction(
          t.reference,
        );

        const transaction = await this.prismaService.transaction.findUnique({
          where: { id: remoteTransaction.external_reference },
        });

        if (!transaction || !isDateOlderThanHours(transaction.createdAt, 1)) {
          continue;
        }

        if (transaction.status === Status.Pending) {
          const updated = await this.prismaService.transaction.update({
            where: { id: transaction.id },
            data: { status: remoteTransaction.status },
          });

          if (
            updated.motif === TransactionMotif.AppFee &&
            updated.status === Status.Success
          ) {
            await this.prismaService.user.update({
              where: { id: updated.userId },
              data: { hasPayment: true },
            });
          }
        }
      } catch (error) {
        //
      }
    }
  }
}
