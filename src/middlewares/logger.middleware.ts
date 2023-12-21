import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CustomLogger } from 'src/utils/logger';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new CustomLogger('LoggerMiddleware');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;

    const startTime = Date.now();

    res.on('finish', () => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const logMessage = `${method} ${originalUrl} - ${res.statusCode} ${responseTime}ms`;
      this.logger.log(logMessage);
    });

    next();
  }
}
