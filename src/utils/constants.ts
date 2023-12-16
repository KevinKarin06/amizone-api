export const QUEUE_LOCK_DURATION = 5 * 60 * 1000;
export const PUBLIC_DIR = 'exports';
export const EVENTS = {
  otpSend: 'otp.send',
  launchExport: 'export.launch',
};

export enum TransactionMotif {
  AppFee = 'APP_PAYMENT',
  ReferralGain = 'REFERRAL_GAIN',
}

export enum Status {
  Pending = 'PENDING',
  Success = 'SUCCESS',
  Failed = 'FAILED',
}

export const MAX_DEPTH = 3;
