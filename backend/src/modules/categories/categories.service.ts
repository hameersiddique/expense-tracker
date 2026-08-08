import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category, Transaction } from '../../entities';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private categoriesRepository: Repository<Category>,
    @InjectRepository(Transaction) private transactionsRepository: Repository<Transaction>,
  ) {}

  async findAll(userId: string, includeArchived = false): Promise<Category[]> {
    const where: Record<string, unknown> = { userId };
    if (!includeArchived) where.isArchived = false;
    return this.categoriesRepository.find({ where, relations: ['subcategories'], order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async findOne(userId: string, id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id }, relations: ['subcategories'] });
    if (!category) throw new NotFoundException('Category not found');
    this.assertOwnership(category, userId);
    return category;
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    const count = await this.categoriesRepository.count({ where: { userId } });
    const category = this.categoriesRepository.create({
      userId, name: dto.name, type: dto.type, icon: dto.icon ?? null, color: dto.color ?? null, sortOrder: count,
    });
    return this.categoriesRepository.save(category);
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(userId, id);
    Object.assign(category, dto);
    return this.categoriesRepository.save(category);
  }

  async archive(userId: string, id: string): Promise<Category> {
    const category = await this.findOne(userId, id);
    category.isArchived = true;
    return this.categoriesRepository.save(category);
  }

  async unarchive(userId: string, id: string): Promise<Category> {
    const category = await this.findOne(userId, id);
    category.isArchived = false;
    return this.categoriesRepository.save(category);
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    const category = await this.findOne(userId, id);
    const usageCount = await this.transactionsRepository.count({ where: { categoryId: id } });
    if (usageCount > 0) throw new BadRequestException(`Cannot delete a category used by ${usageCount} transaction(s). Archive it instead.`);
    await this.categoriesRepository.remove(category);
    return { message: 'Category deleted' };
  }

  private assertOwnership(category: Category, userId: string): void {
    if (category.userId !== userId) throw new ForbiddenException('You do not have access to this category');
  }
}
