import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('export')
export class ExportWorker {
  @Process({ concurrency: 10 })
  async processTransaction(job: Job<unknown>) {
    console.log('Processing: ', job.data);

    await this.delay(10000);
    console.log('Finished processing: ', job.data);
    return {};
  }

  delay = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
}
