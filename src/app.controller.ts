import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './guards/auth.guard';

@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  index() {
    return this.appService.index();
  }
}
