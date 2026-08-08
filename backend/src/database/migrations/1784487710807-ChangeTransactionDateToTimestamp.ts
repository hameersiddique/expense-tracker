import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeTransactionDateToTimestamp1784487710807 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "date" TYPE timestamptz USING "date"::timestamptz`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "date" TYPE date USING "date"::date`);
  }
}
