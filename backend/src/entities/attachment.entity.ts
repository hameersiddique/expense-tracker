import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Transaction } from './transaction.entity';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'transaction_id' }) transactionId: string;
  @ManyToOne(() => Transaction, (t) => t.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transaction_id' }) transaction: Transaction;
  @Column({ name: 'file_name' }) fileName: string;
  @Column({ name: 'file_path' }) filePath: string;
  @Column({ name: 'file_size' }) fileSize: number;
  @Column({ name: 'mime_type' }) mimeType: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
