import { ConflictException, HttpException, Injectable } from '@nestjs/common';
import { TransactionData, TransactionDto } from './transaction.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ApiResponse } from 'src/types/response';
import { user } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Status, TransactionMotif } from 'src/utils/constants';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TransactionService {
  constructor(
    @InjectQueue('transaction') private queueService: Queue,
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

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

    try {
      await this.queueService.add(
        { ...data, userId: authUser.id },
        {
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
    } catch (error) {
      throw new HttpException('Cannot process transaction', 500);
    }

    return new ApiResponse({ data: {}, statusCode: 201 });
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
          updated.motif === 'APP_PAYMENT' &&
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
}
