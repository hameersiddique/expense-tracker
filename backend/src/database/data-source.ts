import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import {
  User, RefreshToken, Category, Subcategory, Account, PaymentMethod, Transaction, Attachment, AuditLog,
} from '../entities';

config();

const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;

const base = process.env.DATABASE_URL
  ? { url: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'expense_user',
      password: process.env.DB_PASSWORD || 'expense_pass123',
      database: process.env.DB_DATABASE || 'expense_tracker',
    };

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...base,
  ssl,
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  entities: [User, RefreshToken, Category, Subcategory, Account, PaymentMethod, Transaction, Attachment, AuditLog],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsTableName: 'migrations_history',
});
