import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Subcategory } from './subcategory.entity';
import { Transaction } from './transaction.entity';

export enum CategoryType { INCOME = 'income', EXPENSE = 'expense' }

@Entity('categories')
@Index(['userId', 'name'])
export class Category {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'user_id' }) userId: string;
  @ManyToOne(() => User, (u) => u.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) user: User;
  @Column({ length: 100 }) name: string;
  @Column({ type: 'enum', enum: CategoryType, default: CategoryType.EXPENSE }) type: CategoryType;
  @Column({ nullable: true, type: 'varchar', length: 50 }) icon: string | null;
  @Column({ nullable: true, type: 'varchar', length: 20 }) color: string | null;
  @Column({ name: 'is_archived', default: false }) isArchived: boolean;
  @Column({ name: 'is_default', default: false }) isDefault: boolean;
  @Column({ name: 'sort_order', default: 0 }) sortOrder: number;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
  @OneToMany(() => Subcategory, (s) => s.category) subcategories: Subcategory[];
  @OneToMany(() => Transaction, (t) => t.category) transactions: Transaction[];
}
