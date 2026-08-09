import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveMainAccountDefault1784487710808 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "accounts" SET "is_default" = false WHERE "name" = 'Main Account' AND "initial_balance" = '0' AND "currency" = 'USD' AND "is_default" = true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "accounts" SET "is_default" = true WHERE "name" = 'Main Account' AND "initial_balance" = '0' AND "currency" = 'USD'`,
    );
  }
}
