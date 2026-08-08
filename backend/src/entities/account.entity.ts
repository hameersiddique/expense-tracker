import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'user_id' }) userId: string;
  @ManyToOne(() => User, (u) => u.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) user: User;
  @Column({ length: 100 }) name: string;
  @Column({ name: 'initial_balance', type: 'decimal', precision: 14, scale: 2, default: 0 }) initialBalance: string;
  @Column({ length: 3, default: 'USD' }) currency: string;
  @Column({ name: 'is_default', default: false }) isDefault: boolean;
  @Column({ name: 'is_archived', default: false }) isArchived: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
  @OneToMany(() => Transaction, (t) => t.account) transactions: Transaction[];
}
