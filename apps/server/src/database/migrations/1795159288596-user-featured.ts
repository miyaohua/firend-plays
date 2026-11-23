import { MigrationInterface, QueryRunner } from "typeorm";

export class UserFeatured1795159288596 implements MigrationInterface {
    name = 'UserFeatured1795159288596'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`sys_user\` ADD \`is_featured\` char(1) NOT NULL COMMENT '是否精选用户（1 是 0 否）' DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`sys_user\` ADD \`featured_time\` datetime NULL COMMENT '精选时间'`);
        await queryRunner.query(`CREATE INDEX \`idx_sys_user_featured\` ON \`sys_user\` (\`is_featured\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`idx_sys_user_featured\` ON \`sys_user\``);
        await queryRunner.query(`ALTER TABLE \`sys_user\` DROP COLUMN \`featured_time\``);
        await queryRunner.query(`ALTER TABLE \`sys_user\` DROP COLUMN \`is_featured\``);
    }

}
