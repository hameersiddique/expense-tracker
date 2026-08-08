import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index({ unique: true }) @Column({ name: 'token_hash', unique: true }) tokenHash: string;
  @Column({ name: 'user_id' }) userId: string;
  @ManyToOne(() => User, (u) => u.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) user: User;
  @Column({ name: 'expires_at', type: 'timestamptz' }) expiresAt: Date;
  @Column({ name: 'is_revoked', default: false }) isRevoked: boolean;
  @Column({ name: 'user_agent', nullable: true, type: 'varchar' }) userAgent: string | null;
  @Column({ name: 'ip_address', nullable: true, type: 'varchar' }) ipAddress: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
