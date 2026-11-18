import { MigrationInterface, QueryRunner } from "typeorm";

export class GunCodeFavorite1794901488432 implements MigrationInterface {
    name = 'GunCodeFavorite1794901488432'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`gun_code_favorite\` (\`create_time\` datetime(0) NOT NULL COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP, \`update_time\` datetime(0) NOT NULL COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, \`delete_time\` datetime(0) NULL COMMENT '删除时间', \`create_by\` varchar(36) NULL COMMENT '创建人', \`update_by\` varchar(36) NULL COMMENT '更新人', \`id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL COMMENT '收藏人 ID', \`code_id\` varchar(36) NOT NULL COMMENT '被收藏的改枪码 ID', INDEX \`idx_gun_code_favorite_code\` (\`code_id\`), UNIQUE INDEX \`uk_gun_code_favorite_user_code\` (\`user_id\`, \`code_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`uk_gun_code_favorite_user_code\` ON \`gun_code_favorite\``);
        await queryRunner.query(`DROP INDEX \`idx_gun_code_favorite_code\` ON \`gun_code_favorite\``);
        await queryRunner.query(`DROP TABLE \`gun_code_favorite\``);
    }

}
