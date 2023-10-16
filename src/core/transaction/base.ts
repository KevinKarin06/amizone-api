import { TransactionPayload } from 'src/types/misc';

export abstract class BaseTransaction {
  abstract requestToPay(data: TransactionPayload): any;
  abstract sendTo(data: TransactionPayload): any;
  abstract getTransaction(id: string): any;
}
