import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto, CategoryDto } from './dto';
import { UpdateCategoryDto } from './dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category } from './schema';
import { Model, Types } from 'mongoose';
import { User } from 'src/user/schema';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async createCategory(user: User, payload: CreateCategoryDto): Promise<any> {
    try {
      const { name, description } = payload;
      return await this.categoryModel.create({
        user: new Types.ObjectId(user._id),
        name: name,
        description: description,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getCategoryDetails(payload: CategoryDto): Promise<any> {
    try {
      const { categoryId } = payload;
      const category = await this.categoryModel.findById(categoryId).lean();

      if (!category) {
        throw new NotFoundException('Category not found.');
      }

      return category;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getAllCategories(query: {
    page: number;
    limit: number;
    searchBy?: string;
  }): Promise<any> {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 15;
      const skip = (page - 1) * limit;

      const { searchBy } = query;

      const filter: Record<string, any> = {};

      if (searchBy?.trim()) {
        const regex = { $regex: searchBy.trim(), $options: 'i' };

        const conditions: any[] = [{ name: regex }];

        if (Types.ObjectId.isValid(searchBy)) {
          conditions.push({ _id: new Types.ObjectId(searchBy) });
        }

        filter.$or = conditions;
      }

      const [categories, total] = await Promise.all([
        this.categoryModel
          .find(filter)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        this.categoryModel.countDocuments(filter),
      ]);

      return {
        categories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async updateCategory(payload: UpdateCategoryDto): Promise<any> {
    try {
      const { categoryId, name, description } = payload;

      const updated = await this.categoryModel.findByIdAndUpdate(
        categoryId,
        {
          ...(name && { name }),
          ...(description !== undefined && { description }),
        },
        { new: true },
      );

      if (!updated) {
        throw new NotFoundException('Category not found');
      }

      return updated;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async deleteCategory(payload: CategoryDto): Promise<any> {
    try {
      const { categoryId } = payload;

      const category = await this.categoryModel.findByIdAndDelete(categoryId);

      if (!category) {
        throw new NotFoundException('Category not found.');
      }

      return { message: 'Category deleted successfully' };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
