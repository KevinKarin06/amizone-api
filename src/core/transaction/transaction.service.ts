import { Injectable } from '@nestjs/common';
import { CamPayAPI } from './campay-api';

@Injectable()
export class TransactionService extends CamPayAPI {}
