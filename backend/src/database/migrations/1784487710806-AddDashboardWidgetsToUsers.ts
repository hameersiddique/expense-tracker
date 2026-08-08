import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDashboardWidgetsToUsers1784487710806 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "dashboard_widgets" jsonb NOT NULL DEFAULT '{}'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "dashboard_widgets"`);
  }
}
