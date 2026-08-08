import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subcategory, Category, Transaction } from '../../entities';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { MoveSubcategoryDto } from './dto/move-subcategory.dto';

@Injectable()
export class SubcategoriesService {
  constructor(
    @InjectRepository(Subcategory) private subcategoriesRepository: Repository<Subcategory>,
    @InjectRepository(Category) private categoriesRepository: Repository<Category>,
    @InjectRepository(Transaction) private transactionsRepository: Repository<Transaction>,
  ) {}

  async findAll(userId: string, categoryId?: string): Promise<Subcategory[]> {
    const where: Record<string, unknown> = { userId };
    if (categoryId) where.categoryId = categoryId;
    return this.subcategoriesRepository.find({ where, order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async findOne(userId: string, id: string): Promise<Subcategory> {
    const subcategory = await this.subcategoriesRepository.findOne({ where: { id } });
    if (!subcategory) throw new NotFoundException('Subcategory not found');
    this.assertOwnership(subcategory, userId);
    return subcategory;
  }

  async create(userId: string, dto: CreateSubcategoryDto): Promise<Subcategory> {
    const category = await this.categoriesRepository.findOne({ where: { id: dto.categoryId } });
    if (!category || category.userId !== userId) throw new NotFoundException('Target category not found');
    const count = await this.subcategoriesRepository.count({ where: { categoryId: dto.categoryId } });
    const subcategory = this.subcategoriesRepository.create({ userId, categoryId: dto.categoryId, name: dto.name, sortOrder: count });
    return this.subcategoriesRepository.save(subcategory);
  }

  async update(userId: string, id: string, dto: UpdateSubcategoryDto): Promise<Subcategory> {
    const subcategory = await this.findOne(userId, id);
    Object.assign(subcategory, dto);
    return this.subcategoriesRepository.save(subcategory);
  }

  async move(userId: string, id: string, dto: MoveSubcategoryDto): Promise<Subcategory> {
    const subcategory = await this.findOne(userId, id);
    const targetCategory = await this.categoriesRepository.findOne({ where: { id: dto.targetCategoryId } });
    if (!targetCategory || targetCategory.userId !== userId) throw new NotFoundException('Target category not found');
    subcategory.categoryId = dto.targetCategoryId;
    return this.subcategoriesRepository.save(subcategory);
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    const subcategory = await this.findOne(userId, id);
    const usageCount = await this.transactionsRepository.count({ where: { subcategoryId: id } });
    if (usageCount > 0) throw new BadRequestException(`Cannot delete a subcategory used by ${usageCount} transaction(s).`);
    await this.subcategoriesRepository.remove(subcategory);
    return { message: 'Subcategory deleted' };
  }

  private assertOwnership(subcategory: Subcategory, userId: string): void {
    if (subcategory.userId !== userId) throw new ForbiddenException('You do not have access to this subcategory');
  }
}
