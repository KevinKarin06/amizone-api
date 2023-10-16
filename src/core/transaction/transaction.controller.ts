import { Body, Controller, Post, Req } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionDto } from './transaction.dto';
import { Admin, Payment } from 'src/guards/auth.guard';

@Admin(false)
@Payment(false)
@Controller('transaction')
export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  @Post('init')
  async initializeTransaction(@Body() data: TransactionDto, @Req() req: any) {
    return await this.transactionService.initializeTransaction(data, req.user);
  }
}
