import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto, CategoryDto } from './dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthGuard, RolesGuard } from 'src/common/guards';
import { ROLE } from 'src/common/constants';
import { GetUser, Roles } from 'src/common/decorators';
import { User } from 'src/user/schema';

@Controller('categories')
@UseGuards(AuthGuard, RolesGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('create')
  @Roles(ROLE.ADMIN)
  createCategory(
    @GetUser() user: User,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoryService.createCategory(user, createCategoryDto);
  }

  @Post('details')
  @Roles(ROLE.ADMIN)
  getCategoryDetails(@Body() payload: CategoryDto) {
    return this.categoryService.getCategoryDetails(payload);
  }

  @Post('all')
  @Roles(ROLE.ADMIN)
  getAllCategories(@Query() query) {
    return this.categoryService.getAllCategories(query);
  }

  @Post('update')
  @Roles(ROLE.ADMIN)
  updateCategory(@Body() payload: UpdateCategoryDto) {
    return this.categoryService.updateCategory(payload);
  }

  @Post('delete')
  @Roles(ROLE.ADMIN)
  deleteCategory(@Body() payload: CategoryDto) {
    return this.categoryService.deleteCategory(payload);
  }
}
