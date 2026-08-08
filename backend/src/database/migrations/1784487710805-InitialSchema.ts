import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1784487710805 implements MigrationInterface {
    name = 'InitialSchema1784487710805'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "initial_balance" numeric(14,2) NOT NULL DEFAULT '0', "currency" character varying(3) NOT NULL DEFAULT 'USD', "is_default" boolean NOT NULL DEFAULT false, "is_archived" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payment_methods_type_enum" AS ENUM('cash', 'bank', 'credit_card', 'debit_card', 'wallet', 'other')`);
        await queryRunner.query(`CREATE TABLE "payment_methods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" "public"."payment_methods_type_enum" NOT NULL, "name" character varying(100) NOT NULL, "is_default" boolean NOT NULL DEFAULT false, "is_archived" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_34f9b8c6dfb4ac3559f7e2820d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "transaction_id" uuid NOT NULL, "file_name" character varying NOT NULL, "file_path" character varying NOT NULL, "file_size" integer NOT NULL, "mime_type" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('income', 'expense')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" "public"."transactions_type_enum" NOT NULL, "amount" numeric(14,2) NOT NULL, "category_id" uuid NOT NULL, "subcategory_id" uuid, "date" date NOT NULL, "payment_method_id" uuid, "account_id" uuid, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f0a3677e1b8d83ff31f9300246" ON "transactions" ("user_id", "type") `);
        await queryRunner.query(`CREATE INDEX "IDX_fe815e76e6d1e733cebfd0f903" ON "transactions" ("user_id", "date") `);
        await queryRunner.query(`CREATE TABLE "subcategories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "category_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "is_default" boolean NOT NULL DEFAULT false, "sort_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_793ef34ad0a3f86f09d4837007c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1a3aa354f5d676d2354047554a" ON "subcategories" ("user_id", "category_id") `);
        await queryRunner.query(`CREATE TYPE "public"."categories_type_enum" AS ENUM('income', 'expense')`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "type" "public"."categories_type_enum" NOT NULL DEFAULT 'expense', "icon" character varying(50), "color" character varying(20), "is_archived" boolean NOT NULL DEFAULT false, "is_default" boolean NOT NULL DEFAULT false, "sort_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_48f0690983e955b500b4a3e029" ON "categories" ("user_id", "name") `);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token_hash" character varying NOT NULL, "user_id" uuid NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "is_revoked" boolean NOT NULL DEFAULT false, "user_agent" character varying, "ip_address" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a7838d2ba25be1342091b6695f1" UNIQUE ("token_hash"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a7838d2ba25be1342091b6695f" ON "refresh_tokens" ("token_hash") `);
        await queryRunner.query(`CREATE TYPE "public"."users_theme_enum" AS ENUM('light', 'dark', 'system')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying NOT NULL, "profile_picture_url" character varying, "is_email_verified" boolean NOT NULL DEFAULT false, "email_verification_token" character varying, "password_reset_token" character varying, "password_reset_expires" TIMESTAMP WITH TIME ZONE, "currency" character varying(3) NOT NULL DEFAULT 'USD', "language" character varying(10) NOT NULL DEFAULT 'en', "timezone" character varying(100) NOT NULL DEFAULT 'UTC', "theme" "public"."users_theme_enum" NOT NULL DEFAULT 'system', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "action" character varying(100) NOT NULL, "entity_type" character varying(100) NOT NULL, "entity_id" uuid, "metadata" jsonb, "ip_address" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2f68e345c05e8166ff9deea1ab" ON "audit_logs" ("user_id", "created_at") `);
        await queryRunner.query(`ALTER TABLE "accounts" ADD CONSTRAINT "FK_3000dad1da61b29953f07476324" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD CONSTRAINT "FK_d7d7fb15569674aaadcfbc0428c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attachments" ADD CONSTRAINT "FK_57d149bdf1200d26c13519d9ccf" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_c9e41213ca42d50132ed7ab2b0f" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_2355c28b92b1bbbfe7f8d5b32b9" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_388643fdd3e9eddd7691fcba092" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_49c0d6e8ba4bfb5582000d851f0" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subcategories" ADD CONSTRAINT "FK_ab09bbf3d44569eaf4892bc02a1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subcategories" ADD CONSTRAINT "FK_f7b015bc580ae5179ba5a4f42ec" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_2296b7fe012d95646fa41921c8b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_2296b7fe012d95646fa41921c8b"`);
        await queryRunner.query(`ALTER TABLE "subcategories" DROP CONSTRAINT "FK_f7b015bc580ae5179ba5a4f42ec"`);
        await queryRunner.query(`ALTER TABLE "subcategories" DROP CONSTRAINT "FK_ab09bbf3d44569eaf4892bc02a1"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_49c0d6e8ba4bfb5582000d851f0"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_388643fdd3e9eddd7691fcba092"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_2355c28b92b1bbbfe7f8d5b32b9"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_c9e41213ca42d50132ed7ab2b0f"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b"`);
        await queryRunner.query(`ALTER TABLE "attachments" DROP CONSTRAINT "FK_57d149bdf1200d26c13519d9ccf"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP CONSTRAINT "FK_d7d7fb15569674aaadcfbc0428c"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_3000dad1da61b29953f07476324"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2f68e345c05e8166ff9deea1ab"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_theme_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a7838d2ba25be1342091b6695f"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_48f0690983e955b500b4a3e029"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TYPE "public"."categories_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1a3aa354f5d676d2354047554a"`);
        await queryRunner.query(`DROP TABLE "subcategories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe815e76e6d1e733cebfd0f903"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f0a3677e1b8d83ff31f9300246"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
        await queryRunner.query(`DROP TABLE "attachments"`);
        await queryRunner.query(`DROP TABLE "payment_methods"`);
        await queryRunner.query(`DROP TYPE "public"."payment_methods_type_enum"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
    }

}
