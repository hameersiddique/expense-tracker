import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean })
  @ApiOperation({ summary: 'List all categories with subcategories' })
  findAll(@CurrentUser('sub') userId: string, @Query('includeArchived') includeArchived?: string) {
    return this.categoriesService.findAll(userId, includeArchived === 'true');
  }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a custom category' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(userId, dto);
  }

  @Patch(':id')
  update(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(userId, id, dto);
  }

  @Patch(':id/archive')
  archive(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.archive(userId, id);
  }

  @Patch(':id/unarchive')
  unarchive(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.unarchive(userId, id);
  }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(userId, id);
  }
}
