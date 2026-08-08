import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Category } from './category.entity';
import { Subcategory } from './subcategory.entity';
import { Transaction } from './transaction.entity';
import { Account } from './account.entity';
import { PaymentMethod } from './payment-method.entity';
import { RefreshToken } from './refresh-token.entity';

export enum ThemePreference { LIGHT = 'light', DARK = 'dark', SYSTEM = 'system' }

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'first_name', length: 100 }) firstName: string;
  @Column({ name: 'last_name', length: 100 }) lastName: string;
  @Index({ unique: true }) @Column({ unique: true, length: 255 }) email: string;
  @Exclude({ toPlainOnly: true }) @Column({ name: 'password_hash' }) passwordHash: string;
  @Column({ name: 'profile_picture_url', nullable: true, type: 'varchar' }) profilePictureUrl: string | null;
  @Column({ name: 'is_email_verified', default: false }) isEmailVerified: boolean;
  @Exclude({ toPlainOnly: true })
  @Column({ name: 'email_verification_token', nullable: true, type: 'varchar' })
  emailVerificationToken: string | null;
  @Exclude({ toPlainOnly: true })
  @Column({ name: 'password_reset_token', nullable: true, type: 'varchar' })
  passwordResetToken: string | null;
  @Exclude({ toPlainOnly: true })
  @Column({ name: 'password_reset_expires', nullable: true, type: 'timestamptz' })
  passwordResetExpires: Date | null;
  @Column({ default: 'USD', length: 3 }) currency: string;
  @Column({ default: 'en', length: 10 }) language: string;
  @Column({ default: 'UTC', length: 100 }) timezone: string;
  @Column({ type: 'enum', enum: ThemePreference, default: ThemePreference.SYSTEM }) theme: ThemePreference;
  @Column({ type: 'jsonb', default: () => "'{}'" }) dashboardWidgets: Record<string, boolean>;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
  @OneToMany(() => Category, (c) => c.user) categories: Category[];
  @OneToMany(() => Subcategory, (s) => s.user) subcategories: Subcategory[];
  @OneToMany(() => Transaction, (t) => t.user) transactions: Transaction[];
  @OneToMany(() => Account, (a) => a.user) accounts: Account[];
  @OneToMany(() => PaymentMethod, (p) => p.user) paymentMethods: PaymentMethod[];
  @OneToMany(() => RefreshToken, (r) => r.user) refreshTokens: RefreshToken[];
}
