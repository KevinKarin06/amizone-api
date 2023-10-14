export abstract class BaseTransaction {
  abstract requestToPay(phoneNumber: string, amount: string): any;
  abstract sendTo(phoneNumber: string, amount: string): any;
  abstract getTransaction(id: string): any;
}
