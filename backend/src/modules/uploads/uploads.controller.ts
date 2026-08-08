import { Controller, Post, Delete, Param, UseGuards, UseInterceptors, UploadedFile, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('transactions/:transactionId/receipt')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Attach a receipt image/PDF to a transaction' })
  @UseInterceptors(FileInterceptor('file'))
  attachReceipt(
    @CurrentUser('sub') userId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.uploadsService.attachReceipt(userId, transactionId, file);
  }

  @Delete(':attachmentId')
  @ApiOperation({ summary: 'Remove an attachment' })
  remove(@CurrentUser('sub') userId: string, @Param('attachmentId', ParseUUIDPipe) attachmentId: string) {
    return this.uploadsService.removeAttachment(userId, attachmentId);
  }
}
