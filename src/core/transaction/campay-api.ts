import { BaseTransaction } from './base';

export class CamPayAPI extends BaseTransaction {
  requestToPay(phoneNumber: string, amount: string) {
    throw new Error('Method not implemented.');
  }

  sendTo(phoneNumber: string, amount: string) {
    throw new Error('Method not implemented.');
  }

  getTransaction(id: string) {
    throw new Error('Method not implemented.');
  }
}
