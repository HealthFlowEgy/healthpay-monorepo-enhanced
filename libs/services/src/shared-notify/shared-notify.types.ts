export interface SendNotifyResults {
  errors: string[];
  success: string[];
}

export type AvailableMessages = 'otp' | 'login' | 'charge' | 'deduct';
