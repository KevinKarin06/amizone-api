import { ConflictException, HttpException, Injectable } from '@nestjs/common';
import { TransactionDto } from './transaction.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ApiResponse } from 'src/types/response';
import { user } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus } from 'src/utils/constants';

@Injectable()
export class TransactionService {
  constructor(
    @InjectQueue('transaction') private queueService: Queue,
    private prismaService: PrismaService,
  ) {}

  async initializeTransaction(
    data: TransactionDto,
    authUser: user,
  ): Promise<ApiResponse<any> | HttpException> {
    console.log(authUser);
    const pendingTransaction = await this.prismaService.transaction.findFirst({
      where: {
        userId: authUser.id,
        status: TransactionStatus.Pending,
      },
    });

    if (pendingTransaction) {
      throw new ConflictException('Another transaction is ongoing');
    }

    try {
      await this.queueService.add(data, {
        jobId: authUser.id,
        removeOnComplete: true,
      });
    } catch (error) {
      console.log(error);
    }

    return new ApiResponse({ data: {}, statusCode: 201 });
  }
}
