import { MigrationInterface, QueryRunner } from "typeorm";

export class GunCode1794895165803 implements MigrationInterface {
    name = 'GunCode1794895165803'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`gun_code\` (\`create_time\` datetime(0) NOT NULL COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP, \`update_time\` datetime(0) NOT NULL COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, \`delete_time\` datetime(0) NULL COMMENT '删除时间', \`create_by\` varchar(36) NULL COMMENT '创建人', \`update_by\` varchar(36) NULL COMMENT '更新人', \`id\` varchar(36) NOT NULL, \`dict_type\` varchar(100) NOT NULL COMMENT '武器分类编码（sys_dict_type.dict_type）', \`gun_value\` varchar(100) NOT NULL COMMENT '枪械字典值（sys_dict_data.dict_value）', \`gun_label\` varchar(100) NOT NULL COMMENT '枪械名称快照（字典改名前后的历史数据仍可正确展示）', \`code\` varchar(500) NOT NULL COMMENT '改枪码', \`remark\` varchar(200) NULL COMMENT '备注', \`user_id\` varchar(36) NOT NULL COMMENT '提交人 ID', \`username\` varchar(20) NOT NULL COMMENT '提交人账号快照', \`is_featured\` char(1) NOT NULL COMMENT '是否精选（1 是 0 否）' DEFAULT '0', \`featured_by\` varchar(36) NULL COMMENT '精选操作人', \`featured_time\` datetime NULL COMMENT '精选时间', INDEX \`idx_gun_code_featured\` (\`is_featured\`), INDEX \`idx_gun_code_user\` (\`user_id\`), INDEX \`idx_gun_code_type\` (\`dict_type\`, \`gun_value\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`idx_gun_code_type\` ON \`gun_code\``);
        await queryRunner.query(`DROP INDEX \`idx_gun_code_user\` ON \`gun_code\``);
        await queryRunner.query(`DROP INDEX \`idx_gun_code_featured\` ON \`gun_code\``);
        await queryRunner.query(`DROP TABLE \`gun_code\``);
    }

}
