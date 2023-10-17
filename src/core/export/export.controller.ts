import { Body, Controller, Post, Query, Req } from '@nestjs/common';
import { ExportService } from './export.service';
import { formatQueryParams } from 'src/utils/misc';
import { Public } from 'src/guards/auth.guard';

// @Public()
@Controller('export')
export class ExportController {
  private filterableFields = [
    'name',
    'phoneNumber',
    'profession',
    'sex',
    'interest',
    'phoneVerified',
    'active',
    'email',
    'locale',
    'startDate',
    'endDate',
  ];

  constructor(private exportService: ExportService) {}

  @Post('')
  async getUsers(@Query() params: any, @Body() body: any, @Req() req: any) {
    const queryParams = formatQueryParams(params, this.filterableFields);

    return await this.exportService.launchContactExport(
      req.user,
      queryParams,
      body,
    );
  }
}
