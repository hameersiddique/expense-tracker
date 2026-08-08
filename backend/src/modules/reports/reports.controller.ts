import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('generate')
  @ApiOperation({ summary: 'Generate a report for daily/weekly/monthly/quarterly/yearly/custom periods' })
  async generate(@CurrentUser('sub') userId: string, @Query() query: ReportQueryDto, @Res() res: Response) {
    const { buffer, filename, contentType } = await this.reportsService.generate(userId, query);
    res.set({ 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${filename}"` });
    res.send(buffer);
  }
}
