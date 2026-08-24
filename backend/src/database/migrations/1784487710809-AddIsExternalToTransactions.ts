import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsExternalToTransactions1784487710809 implements MigrationInterface {
  name = 'AddIsExternalToTransactions1784487710809';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "is_external" boolean DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "is_external"`);
  }
}
