import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ExportService } from './export.service';
import { formatQueryParams } from 'src/utils/misc';
import { Admin } from 'src/guards/auth.guard';

@Admin(false)
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
  async exportContacts(
    @Query() params: any,
    @Body() body: any,
    @Req() req: any,
  ) {
    const queryParams = formatQueryParams(params, this.filterableFields);

    return await this.exportService.launchContactExport(
      req.user,
      queryParams,
      body,
    );
  }

  @Get('')
  async getExports(@Query() params: any, @Req() req: any) {
    const queryParams = formatQueryParams(params, this.filterableFields);

    return await this.exportService.getUserExports(req.user, queryParams);
  }

  @Get(':id')
  async downloadExport(
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
    @Param('id') id: string,
  ) {
    res.set({
      'Content-Type': 'text/vcard',
      'Content-Disposition': `attachment; filename="${id}.vcf"`,
    });
    return await this.exportService.downloadContactExport(id, req.user);
  }
}
