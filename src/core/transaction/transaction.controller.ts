import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionData, TransactionDto } from './transaction.dto';
import { Admin, Payment, Public } from 'src/guards/auth.guard';
import { formatQueryParams } from 'src/utils/misc';

@Admin(false)
@Payment(false)
@Controller('transaction')
export class TransactionController {
  private filterableFields = [
    'id',
    'type',
    'amount',
    'status',
    'senderPhoneNumber',
    'receiverPhoneNumber',
    'motif',
    'startDate',
    'endDate',
  ];

  constructor(private transactionService: TransactionService) {}

  @Get('')
  async getTransactions(@Query() params: any, @Req() req: any) {
    const queryParams = formatQueryParams(params, this.filterableFields);

    return await this.transactionService.getTransactions(queryParams, req.user);
  }

  @Post('')
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
