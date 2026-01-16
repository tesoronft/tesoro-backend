import { Injectable, NotFoundException } from '@nestjs/common';
import { Condition } from './schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/user/schema';
import { ConditionDto, CreateConditionDto, UpdateConditionDto } from './dto';

@Injectable()
export class ConditionService {
  constructor(
    @InjectModel(Condition.name) private conditionModel: Model<Condition>,
  ) {}

  async createCondition(user: User, payload: CreateConditionDto): Promise<any> {
    try {
      const { name, description } = payload;
      const condition = await this.conditionModel.create({
        user: new Types.ObjectId(user._id),
        name,
        description,
      });

      return {
        message: 'Condition created successfully',
        data: condition,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getConditionDetails(payload: ConditionDto): Promise<any> {
    try {
      const { conditionId } = payload;
      const condition = await this.conditionModel.findById(conditionId).lean();

      if (!condition) {
        throw new NotFoundException('Condition not found.');
      }

      return condition;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getAllConditions(query: {
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

      const [conditionss, total] = await Promise.all([
        this.conditionModel
          .find(filter)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        this.conditionModel.countDocuments(filter),
      ]);

      return {
        conditionss,
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

  async updateCondition(payload: UpdateConditionDto): Promise<any> {
    try {
      const { conditionId, name, description } = payload;

      const updated = await this.conditionModel.findByIdAndUpdate(
        conditionId,
        {
          ...(name && { name }),
          ...(description !== undefined && { description }),
        },
        { new: true },
      );

      if (!updated) {
        throw new NotFoundException('Condition not found');
      }

      return {
        message: 'Condition updated successfully',
        data: updated,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async deleteCondition(payload: ConditionDto): Promise<any> {
    try {
      const { conditionId } = payload;

      const condition =
        await this.conditionModel.findByIdAndDelete(conditionId);

      if (!condition) {
        throw new NotFoundException('Condition not found.');
      }

      return { message: 'Condition deleted successfully' };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
