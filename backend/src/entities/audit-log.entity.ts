import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'user_id', type: 'uuid', nullable: true }) userId: string | null;
  @Column({ length: 100 }) action: string;
  @Column({ name: 'entity_type', length: 100 }) entityType: string;
  @Column({ name: 'entity_id', type: 'uuid', nullable: true }) entityId: string | null;
  @Column({ type: 'jsonb', nullable: true }) metadata: Record<string, unknown> | null;
  @Column({ name: 'ip_address', nullable: true, type: 'varchar' }) ipAddress: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
