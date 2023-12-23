import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionData, TransactionDto } from './transaction.dto';
import { Admin, Payment, Public } from 'src/guards/auth.guard';
import { formatQueryParams } from 'src/utils/misc';
import { TransactionMotif } from 'src/utils/constants';

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

  @Admin(true)
  @Get('total-revenue')
  async getTotalRevenue() {
    return await this.transactionService.calculateTotalRevenue();
  }

  @Admin(true)
  @Get('total-received')
  async getTotalReceived() {
    return await this.transactionService.getTotalTransactionsByMotif(
      TransactionMotif.AppFee,
    );
  }

  @Admin(true)
  @Get('total-received/monthly')
  async getTotalReceivedMonthly(@Req() req: any) {
    return await this.transactionService.getTotalMonthlyTransactionsByMotif(
      TransactionMotif.AppFee,
      req.query?.year || new Date().getFullYear(),
    );
  }

  @Admin(true)
  @Get('total-withdrawn')
  async getTotalWithdrawn() {
    return await this.transactionService.getTotalTransactionsByMotif(
      TransactionMotif.ReferralGain,
    );
  }

  @Admin(true)
  @Get('total-withdrawn/monthly')
  async getTotalWithdrawnMonthly(@Req() req: any) {
    return await this.transactionService.getTotalMonthlyTransactionsByMotif(
      TransactionMotif.ReferralGain,
      req.query?.year || new Date().getFullYear(),
    );
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
