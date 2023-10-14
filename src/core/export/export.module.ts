import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';

@Module({
  providers: [ExportService],
  controllers: [ExportController],
})
export class ExportModule {}
