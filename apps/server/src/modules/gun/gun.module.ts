import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DictDataEntity, DictTypeEntity, GunCodeEntity } from '@/common'
import { UserModule } from '../system/user/user.module'
import { GunCodeController } from './code/code.controller'
import { GunCodeService } from './code/code.service'

@Module({
  imports: [TypeOrmModule.forFeature([GunCodeEntity, DictTypeEntity, DictDataEntity]), UserModule],
  controllers: [GunCodeController],
  providers: [GunCodeService],
  exports: [GunCodeService],
})
export class GunModule {}
