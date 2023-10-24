import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionData, TransactionDto } from './transaction.dto';
import { Admin, Payment, Public } from 'src/guards/auth.guard';

@Admin(false)
@Payment(false)
@Controller('transaction')
export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  @Post('init')
  async initializeTransaction(@Body() data: TransactionDto, @Req() req: any) {
    return await this.transactionService.initializeTransaction(data, req.user);
  }

  @Public()
  @Get('callback')
  async transactionCallback(@Query() data: TransactionData) {
    this.transactionService.onTransactionComplete(data);
    return;
  }
}
