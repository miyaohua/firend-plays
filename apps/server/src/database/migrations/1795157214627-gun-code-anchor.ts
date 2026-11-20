import { MigrationInterface, QueryRunner } from "typeorm";

export class GunCodeAnchor1795157214627 implements MigrationInterface {
    name = 'GunCodeAnchor1795157214627'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`gun_code\` ADD \`is_anchor\` char(1) NOT NULL COMMENT '是否主播推荐（1 是 0 否）' DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`gun_code\` ADD \`anchor_time\` datetime NULL COMMENT '主播推荐时间'`);
        await queryRunner.query(`CREATE INDEX \`idx_gun_code_anchor\` ON \`gun_code\` (\`is_anchor\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`idx_gun_code_anchor\` ON \`gun_code\``);
        await queryRunner.query(`ALTER TABLE \`gun_code\` DROP COLUMN \`anchor_time\``);
        await queryRunner.query(`ALTER TABLE \`gun_code\` DROP COLUMN \`is_anchor\``);
    }

}
