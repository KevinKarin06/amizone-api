export class ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;

  constructor({
    data,
    message = 'Request successful',
    statusCode = 200,
  }: {
    data: T;
    message?: string;
    statusCode?: number;
  }) {
    this.data = data;
    this.message = message;
    this.statusCode = statusCode;
  }
}
