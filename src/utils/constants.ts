export const QUEUE_LOCK_DURATION = 5 * 60 * 1000;
export const PUBLIC_DIR = 'exports';
export const EVENTS = {
  otpSend: 'otp.send',
  launchExport: 'export.launch',
  signupCompletionReminder: 'signup.reminder',
};

export enum TransactionMotif {
  AppFee = 'APP_PAYMENT',
  ReferralGain = 'REFERRAL_GAIN',
}

export enum TransactionType {
  Debit = 'DEBIT',
  Credit = 'CREDIT',
}

export enum Status {
  Pending = 'PENDING',
  Success = 'SUCCESSFUL',
  Failed = 'FAILED',
}

export const MAX_DEPTH = 3;
