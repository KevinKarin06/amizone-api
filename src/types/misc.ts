export interface SmsMessage {
  message: string;
  phoneNumber: string;
}

export interface TransactionPayload {
  id: string;
  message: string;
  amount: string;
  phoneNumber: string;
}
