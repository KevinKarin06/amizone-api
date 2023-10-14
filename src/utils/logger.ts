import { Logger } from '@nestjs/common';

export class CustomLogger extends Logger {
  private logContext: any;

  setContext(logContext) {
    this.logContext = logContext;
  }

  private appendLogContext(message) {
    if (this.logContext) {
      message = `PID ${process.pid}- ${this.logContext.uid} - ${this.logContext.pimName} - ${this.logContext.shopName} : ${message}`;
    }
    return message;
  }

  log(message: any, ...optionalParams: any[]) {
    message = this.appendLogContext(message);
    super.log(message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    message = this.appendLogContext(message);
    super.error(message, ...optionalParams);
  }
}
