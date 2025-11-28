import { Body, Injectable, NotFoundException, Post } from '@nestjs/common';
import { CreateTreasureDto } from './dto/create-treasure.dto';
import { UpdateTreasureDto } from './dto/update-treasure.dto';
import { Treasure } from './schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DeleteTreasureDto, GetTreasureDto } from './dto';
import { User } from 'src/user/schema';

@Injectable()
export class TreasureService {
  constructor(
    @InjectModel(Treasure.name) private treasureModel: Model<Treasure>,
  ) {}

  async createTreasure(payload: CreateTreasureDto, user: User) {
    try {
      const treasure = await this.treasureModel.create({
        ...payload,
        userId: user._id,
      });

      return {
        message: 'Treasure created successfully',
        treasure,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getTreasureDetail(payload: GetTreasureDto) {
    try {
      const { treasureId } = payload;
      const treasure = await this.treasureModel.findById(treasureId);
      if (!treasure) throw new NotFoundException('Treasure not found');

      return treasure;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getAllTreasures(
    query: {
      page?: number;
      limit?: number;
      searchBy?: string;
      category?: string;
      condition?: string;
    },
    user: User,
  ): Promise<any> {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 15;
      const skip = (page - 1) * limit;

      const { searchBy, category, condition } = query;

      const filter: Record<string, any> = {};

      // 🔒 If normal user → restrict to their own treasures
      if (user.role === 'User') {
        filter.userId = user._id;
      }
      // If Admin, do nothing → full access

      // Filter by category
      if (category) filter.category = category;

      // Filter by condition
      if (condition) filter.condition = condition;

      // Search across multiple fields
      if (searchBy?.trim()) {
        const regex = { $regex: searchBy.trim(), $options: 'i' };

        const conditions: any[] = [
          { title: regex },
          { brand: regex },
          { type: regex },
          { itemModel: regex },
          { description: regex },
        ];

        if (Types.ObjectId.isValid(searchBy)) {
          conditions.push({ _id: new Types.ObjectId(searchBy) });
        }

        filter.$or = conditions;
      }

      const [treasures, total] = await Promise.all([
        this.treasureModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        this.treasureModel.countDocuments(filter),
      ]);

      return {
        treasures,
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

  async updateTreasure(payload: UpdateTreasureDto) {
    try {
      const { treasureId, ...updateFields } = payload;

      const updated = await this.treasureModel.findByIdAndUpdate(
        treasureId,
        { $set: updateFields },
        { new: true },
      );

      if (!updated) throw new NotFoundException('Treasure not found');

      return { message: 'Treasure updated successfully', updated };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async deleteTreasure(payload: DeleteTreasureDto) {
    try {
      const { treasureId } = payload;
      const treasure = await this.treasureModel.findByIdAndDelete(treasureId);
      if (!treasure) throw new NotFoundException('Treasure not found');

      return { message: 'Treasure deleted successfully' };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
