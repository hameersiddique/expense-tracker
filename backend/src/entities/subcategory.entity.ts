import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Transaction } from './transaction.entity';

@Entity('subcategories')
@Index(['userId', 'categoryId'])
export class Subcategory {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'user_id' }) userId: string;
  @ManyToOne(() => User, (u) => u.subcategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) user: User;
  @Column({ name: 'category_id' }) categoryId: string;
  @ManyToOne(() => Category, (c) => c.subcategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' }) category: Category;
  @Column({ length: 100 }) name: string;
  @Column({ name: 'is_default', default: false }) isDefault: boolean;
  @Column({ name: 'sort_order', default: 0 }) sortOrder: number;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
  @OneToMany(() => Transaction, (t) => t.subcategory) transactions: Transaction[];
}
