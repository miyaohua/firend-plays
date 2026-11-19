import { MigrationInterface, QueryRunner } from "typeorm";

export class SysNotice1795077045140 implements MigrationInterface {
    name = 'SysNotice1795077045140'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`sys_notice\` (\`create_time\` datetime(0) NOT NULL COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP, \`update_time\` datetime(0) NOT NULL COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, \`delete_time\` datetime(0) NULL COMMENT '删除时间', \`create_by\` varchar(36) NULL COMMENT '创建人', \`update_by\` varchar(36) NULL COMMENT '更新人', \`id\` varchar(36) NOT NULL, \`title\` varchar(100) NOT NULL COMMENT '公告标题', \`content\` text NOT NULL COMMENT '公告内容', \`sort\` int NOT NULL COMMENT '排序（越小越靠前）' DEFAULT '1', \`status\` char(1) NOT NULL COMMENT '状态（1 启用 / 0 停用）' DEFAULT '1', INDEX \`idx_sys_notice_status\` (\`status\`, \`sort\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`idx_sys_notice_status\` ON \`sys_notice\``);
        await queryRunner.query(`DROP TABLE \`sys_notice\``);
    }

}
