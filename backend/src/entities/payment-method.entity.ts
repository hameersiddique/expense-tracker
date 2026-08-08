import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';

export enum PaymentMethodType {
  CASH = 'cash', BANK = 'bank', CREDIT_CARD = 'credit_card', DEBIT_CARD = 'debit_card', WALLET = 'wallet', OTHER = 'other',
}

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'user_id' }) userId: string;
  @ManyToOne(() => User, (u) => u.paymentMethods, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) user: User;
  @Column({ type: 'enum', enum: PaymentMethodType }) type: PaymentMethodType;
  @Column({ length: 100 }) name: string;
  @Column({ name: 'is_default', default: false }) isDefault: boolean;
  @Column({ name: 'is_archived', default: false }) isArchived: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @OneToMany(() => Transaction, (t) => t.paymentMethod) transactions: Transaction[];
}
