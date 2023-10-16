export const QUEUE_LOCK_DURATION = 5 * 60 * 1000;
export const PUBLIC_DIR = 'exports';
export const EVENTS = {
  otpSend: 'otp.send',
};

export enum TransactionMotif {
  AppPayment = 'APP_PAYMENT',
  ReferralGain = 'REFERRAL_GAIN',
}

export enum TransactionStatus {
  Pending = 'PENDING',
  Success = 'SUCCESS',
  Failed = 'FAILED',
}
