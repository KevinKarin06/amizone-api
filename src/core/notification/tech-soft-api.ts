import axios, { AxiosInstance } from 'axios';
import { SmsMessage } from 'src/types/misc';
import { CustomLogger } from 'src/utils/logger';

export class TechSoftAPI {
  private httpClient: AxiosInstance = null;
  private logger = new CustomLogger('TechSoftAPI');
  private baseUrl = 'https://app.techsoft-web-agency.com/sms/api';
  constructor() {
    this.httpClient = axios.create({
      baseURL: `${this.baseUrl}`,
    });
  }

  async sendSms(data: SmsMessage) {
    try {
      await this.httpClient.get(this.buildSmsUrl(data));
    } catch (error) {
      this.logger.error(error);
    }
  }

  private buildSmsUrl(data: SmsMessage): string {
    return `?action=send-sms&api_key=${process.env.SMS_SECRET}
    &to=${data.phoneNumber}&from=${process.env.SMS_SENDER_ID}&sms=${data.message}`;
  }
}
