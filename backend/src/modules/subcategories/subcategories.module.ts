import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subcategory, Category, Transaction } from '../../entities';
import { SubcategoriesService } from './subcategories.service';
import { SubcategoriesController } from './subcategories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subcategory, Category, Transaction])],
  controllers: [SubcategoriesController],
  providers: [SubcategoriesService],
  exports: [SubcategoriesService],
})
export class SubcategoriesModule {}
