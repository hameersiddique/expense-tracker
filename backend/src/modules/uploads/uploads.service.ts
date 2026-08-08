import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Attachment, Transaction } from '../../entities';

const UPLOAD_ROOT = process.env.UPLOAD_DEST || './uploads';
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(Attachment) private attachmentsRepository: Repository<Attachment>,
    @InjectRepository(Transaction) private transactionsRepository: Repository<Transaction>,
  ) {
    if (!existsSync(UPLOAD_ROOT)) mkdirSync(UPLOAD_ROOT, { recursive: true });
  }

  async attachReceipt(userId: string, transactionId: string, file: Express.Multer.File): Promise<Attachment> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WEBP, or PDF files are allowed');
    }
    const transaction = await this.transactionsRepository.findOne({ where: { id: transactionId } });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.userId !== userId) throw new ForbiddenException('Access denied');

    const fileName = `${uuidv4()}-${file.originalname}`;
    const filePath = join(UPLOAD_ROOT, fileName);
    writeFileSync(filePath, file.buffer);

    const attachment = this.attachmentsRepository.create({
      transactionId, fileName: file.originalname, filePath, fileSize: file.size, mimeType: file.mimetype,
    });
    return this.attachmentsRepository.save(attachment);
  }

  async removeAttachment(userId: string, attachmentId: string): Promise<{ message: string }> {
    const attachment = await this.attachmentsRepository.findOne({ where: { id: attachmentId }, relations: ['transaction'] });
    if (!attachment) throw new NotFoundException('Attachment not found');
    if (attachment.transaction.userId !== userId) throw new ForbiddenException('Access denied');

    if (existsSync(attachment.filePath)) unlinkSync(attachment.filePath);
    await this.attachmentsRepository.remove(attachment);
    return { message: 'Attachment removed' };
  }
}
