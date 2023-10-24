import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { CamPayAPI } from './cam-pay-api';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionDto } from './transaction.dto';
import { Status } from 'src/utils/constants';

@Processor('transaction')
export class TransactionWorker {
  private camPayService: CamPayAPI;
  constructor(private prismaService: PrismaService) {}

  @Process({ concurrency: 1 })
  async processTransaction(job: Job<TransactionDto & { userId: string }>) {
    console.log('Processing: ', job.data);
    this.camPayService = await CamPayAPI.build();

    if (job.data.motif === 'APP_PAYMENT') {
      const amount = process.env.APP_FEE || '50';
      const transaction = await this.prismaService.transaction.create({
        data: {
          amount,
          fee: '1',
          motif: job.data.motif,
          receiverPhoneNumber: '2',
          senderPhoneNumber: job.data.phoneNumber,
          type: 's',
          userId: job.data.userId,
        },
      });

      try {
        const response = await this.camPayService.requestToPay({
          amount,
          id: transaction.id,
          message: job.data.motif,
          phoneNumber: job.data.phoneNumber,
        });
        console.log(response);
      } catch (error) {
        console.log(error?.response?.data);
        await this.prismaService.transaction.update({
          where: { id: transaction.id },
          data: {
            status: Status.Failed,
            details: 'Transaction failed',
          },
        });
      }
    } else {
    }

    console.log('Finished processing: ', job.data);
    return {};
  }
}
