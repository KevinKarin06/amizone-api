import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { TransactionService } from './transaction.service';

@Processor('transaction')
export class TransactionWorker {
  constructor(private readonly transactionService: TransactionService) {}

  @Process({ concurrency: 10 })
  async processTransaction(job: Job<unknown>) {
    console.log('Processing: ', job.data);

    const t = await this.transactionService.requestToPay('', '');
    console.log(t);

    await this.delay(10000);
    console.log('Finished processing: ', job.data);
    return {};
  }

  delay = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
}
