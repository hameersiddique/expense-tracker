import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Subcategory } from './subcategory.entity';
import { Account } from './account.entity';
import { PaymentMethod } from './payment-method.entity';
import { Attachment } from './attachment.entity';

export enum TransactionType { INCOME = 'income', EXPENSE = 'expense' }

@Entity('transactions')
@Index(['userId', 'date'])
@Index(['userId', 'type'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'user_id' }) userId: string;
  @ManyToOne(() => User, (u) => u.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) user: User;
  @Column({ type: 'enum', enum: TransactionType }) type: TransactionType;
  @Column({ type: 'decimal', precision: 14, scale: 2 }) amount: string;
  @Column({ name: 'category_id' }) categoryId: string;
  @ManyToOne(() => Category, (c) => c.transactions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' }) category: Category;
  @Column({ name: 'subcategory_id', nullable: true, type: 'uuid' }) subcategoryId: string | null;
  @ManyToOne(() => Subcategory, (s) => s.transactions, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'subcategory_id' }) subcategory: Subcategory | null;
  @Column({ type: 'timestamptz' }) date: string;
  @Column({ name: 'payment_method_id', nullable: true, type: 'uuid' }) paymentMethodId: string | null;
  @ManyToOne(() => PaymentMethod, (p) => p.transactions, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'payment_method_id' }) paymentMethod: PaymentMethod | null;
  @Column({ name: 'account_id', nullable: true, type: 'uuid' }) accountId: string | null;
  @ManyToOne(() => Account, (a) => a.transactions, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'account_id' }) account: Account | null;
  @Column({ type: 'text', nullable: true }) notes: string | null;
  @Column({ name: 'is_external', type: 'boolean', default: false }) isExternal: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
  @DeleteDateColumn({ name: 'deleted_at' }) deletedAt: Date | null;
  @OneToMany(() => Attachment, (a) => a.transaction) attachments: Attachment[];
}
