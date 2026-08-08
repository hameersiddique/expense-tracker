import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SubcategoriesService } from './subcategories.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { MoveSubcategoryDto } from './dto/move-subcategory.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('subcategories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subcategories')
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  @Get()
  @ApiQuery({ name: 'categoryId', required: false })
  findAll(@CurrentUser('sub') userId: string, @Query('categoryId') categoryId?: string) {
    return this.subcategoriesService.findAll(userId, categoryId);
  }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.subcategoriesService.findOne(userId, id);
  }

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateSubcategoryDto) {
    return this.subcategoriesService.create(userId, dto);
  }

  @Patch(':id')
  update(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSubcategoryDto) {
    return this.subcategoriesService.update(userId, id, dto);
  }

  @Patch(':id/move')
  move(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: MoveSubcategoryDto) {
    return this.subcategoriesService.move(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.subcategoriesService.remove(userId, id);
  }
}
