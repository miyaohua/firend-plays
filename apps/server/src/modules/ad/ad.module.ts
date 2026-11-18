import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdEntity } from '@/common'
import { AdService } from './ad.service'
import { AdController } from './ad.controller'

@Module({
  imports: [TypeOrmModule.forFeature([AdEntity])],
  controllers: [AdController],
  providers: [AdService],
  exports: [AdService],
})
export class AdModule {}
