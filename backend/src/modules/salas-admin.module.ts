import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaEntity } from '../database/entities/sala.entity';
import { SalasAdminController } from '../controllers/salas/salas-admin.controller';
import { SalasAdminService } from '../providers/salas-admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([SalaEntity])],
  controllers: [SalasAdminController],
  providers: [SalasAdminService],
  exports: [SalasAdminService],
})
export class SalasAdminModule {}
