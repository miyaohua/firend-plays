import { MigrationInterface, QueryRunner } from "typeorm";

export class GunCodeFeedback1795055814266 implements MigrationInterface {
    name = 'GunCodeFeedback1795055814266'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`gun_code_feedback\` (\`create_time\` datetime(0) NOT NULL COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP, \`update_time\` datetime(0) NOT NULL COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, \`delete_time\` datetime(0) NULL COMMENT '删除时间', \`create_by\` varchar(36) NULL COMMENT '创建人', \`update_by\` varchar(36) NULL COMMENT '更新人', \`id\` varchar(36) NOT NULL, \`code_id\` varchar(36) NOT NULL COMMENT '改枪码 ID', \`user_id\` varchar(36) NOT NULL COMMENT '反馈用户 ID', \`username\` varchar(20) NULL COMMENT '反馈用户账号快照', \`gun_label\` varchar(100) NULL COMMENT '枪械名称快照', \`code\` varchar(500) NULL COMMENT '改枪码内容快照', \`reason\` varchar(200) NULL COMMENT '反馈说明', \`status\` char(1) NOT NULL COMMENT '状态（0 待处理 / 1 已处理 / 2 已忽略）' DEFAULT '0', \`handle_by\` varchar(36) NULL COMMENT '处理人', \`handle_time\` datetime NULL COMMENT '处理时间', \`handle_remark\` varchar(200) NULL COMMENT '处理备注', INDEX \`idx_gun_code_feedback_status\` (\`status\`), UNIQUE INDEX \`uk_gun_code_feedback_user_code\` (\`user_id\`, \`code_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`uk_gun_code_feedback_user_code\` ON \`gun_code_feedback\``);
        await queryRunner.query(`DROP INDEX \`idx_gun_code_feedback_status\` ON \`gun_code_feedback\``);
        await queryRunner.query(`DROP TABLE \`gun_code_feedback\``);
    }

}
