import axios, { AxiosInstance } from 'axios';
import { BaseTransaction } from './base';
import { TransactionPayload } from 'src/types/misc';

export class CamPayAPI extends BaseTransaction {
  private httpClient: AxiosInstance = null;
  private constructor(private authToken: string) {
    super();
    this.httpClient = axios.create({
      baseURL: process.env.CAM_PAY_BASE_URL,
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });
  }

  async requestToPay(data: TransactionPayload) {
    const response = await this.httpClient.post('/collect/', {
      amount: data.amount,
      from: data.phoneNumber,
      description: data.message,
      external_reference: data.id,
    });

    return response.data;
  }

  async sendTo(data: TransactionPayload) {
    const response = await this.httpClient.post('/withdraw/', {
      amount: data.amount,
      to: data.phoneNumber,
      description: data.message,
      external_reference: data.id,
    });

    return response.data;
  }

  async getTransaction(id: string) {
    const response = await this.httpClient.get(`/transaction/${id}/`);

    return response.data;
  }

  public static async build(): Promise<CamPayAPI> {
    const accessToken = await this.getAccessToken();

    return new CamPayAPI(accessToken);
  }

  private static async getAccessToken() {
    const response = await axios.post(
      `${process.env.CAM_PAY_BASE_URL}/token/`,
      {
        username: process.env.CAM_PAY_USER_NAME || '',
        password: process.env.CAM_PAY_USER_PASSWORD || '',
      },
    );

    return response.data.token;
  }
}
