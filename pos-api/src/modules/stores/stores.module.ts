import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './entities/store.entity';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { StoresRepository } from './stores.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Store])],
  controllers: [StoresController],
  providers: [StoresService, StoresRepository],
  exports: [StoresService, StoresRepository, TypeOrmModule],
})
export class StoresModule {}
