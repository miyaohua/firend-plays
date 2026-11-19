import { MigrationInterface, QueryRunner } from "typeorm";

export class FeedbackUserNullable1795057780840 implements MigrationInterface {
    name = 'FeedbackUserNullable1795057780840'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`uk_gun_code_feedback_user_code\` ON \`gun_code_feedback\``);
        await queryRunner.query(`ALTER TABLE \`gun_code_feedback\` CHANGE \`user_id\` \`user_id\` varchar(36) NULL COMMENT '反馈用户 ID（匿名为空）'`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`uk_gun_code_feedback_user_code\` ON \`gun_code_feedback\` (\`user_id\`, \`code_id\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`uk_gun_code_feedback_user_code\` ON \`gun_code_feedback\``);
        await queryRunner.query(`ALTER TABLE \`gun_code_feedback\` CHANGE \`user_id\` \`user_id\` varchar(36) NOT NULL COMMENT '反馈用户 ID'`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`uk_gun_code_feedback_user_code\` ON \`gun_code_feedback\` (\`user_id\`, \`code_id\`)`);
    }

}
