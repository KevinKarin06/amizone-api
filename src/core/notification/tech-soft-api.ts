import axios, { AxiosInstance } from 'axios';
import { SmsMessage } from 'src/types/misc';

export class TechSoftAPI {
  private httpClient: AxiosInstance = null;
  private baseUrl = 'https://app.techsoft-web-agency.com/sms/api';
  constructor() {
    this.httpClient = axios.create({
      baseURL: `${this.baseUrl}`,
    });
  }

  async sendSms(data: SmsMessage) {
    try {
      const r = await this.httpClient.get(this.buildSmsUrl(data));
      console.log('response', r.data);
    } catch (error) {
      console.log('error', error);
    }
  }

  private buildSmsUrl(data: SmsMessage): string {
    return `?action=send-sms&api_key=${process.env.SMS_SECRET}
    &to=${data.phoneNumber}&from=${process.env.SMS_SENDER_ID}&sms=${data.message}`;
  }
}
