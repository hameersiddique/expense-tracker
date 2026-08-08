import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment, Transaction } from '../../entities';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Attachment, Transaction])],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
