import { MigrationInterface, QueryRunner } from "typeorm";

export class Ad1794985824209 implements MigrationInterface {
    name = 'Ad1794985824209'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`sys_ad\` (\`create_time\` datetime(0) NOT NULL COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP, \`update_time\` datetime(0) NOT NULL COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, \`delete_time\` datetime(0) NULL COMMENT '删除时间', \`create_by\` varchar(36) NULL COMMENT '创建人', \`update_by\` varchar(36) NULL COMMENT '更新人', \`id\` varchar(36) NOT NULL, \`title\` varchar(100) NOT NULL COMMENT '广告标题', \`position\` varchar(50) NOT NULL COMMENT '展示位置标识' DEFAULT 'desktop-slot', \`content_type\` char(1) NOT NULL COMMENT '内容类型（I 图片 / T 文字）' DEFAULT 'I', \`image_url\` varchar(255) NULL COMMENT '图片地址（相对 uploads 路径）', \`link_url\` varchar(500) NULL COMMENT '点击跳转地址，为空则不可点击', \`text\` varchar(200) NULL COMMENT '文字广告内容', \`sort\` int NOT NULL COMMENT '排序（越小越靠前）' DEFAULT '1', \`status\` char(1) NOT NULL COMMENT '状态（1 启用 / 0 停用）' DEFAULT '1', \`start_time\` datetime NULL COMMENT '展示开始时间，为空表示不限', \`end_time\` datetime NULL COMMENT '展示结束时间，为空表示不限', \`remark\` varchar(200) NULL COMMENT '备注', \`view_count\` int NOT NULL COMMENT '曝光次数' DEFAULT '0', \`click_count\` int NOT NULL COMMENT '点击次数' DEFAULT '0', INDEX \`idx_sys_ad_position\` (\`position\`, \`status\`, \`sort\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`idx_sys_ad_position\` ON \`sys_ad\``);
        await queryRunner.query(`DROP TABLE \`sys_ad\``);
    }

}
