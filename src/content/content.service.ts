import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Content } from './schema';
import { Model } from 'mongoose';
import {
  CreateContentDto,
  DeleteContentDto,
  GetContentDto,
  ListContentDto,
  UpdateContentDto,
} from './dto';

@Injectable()
export class ContentService {
  constructor(
    @InjectModel(Content.name)
    private readonly contentModel: Model<Content>,
  ) {}

  async createContent(payload: CreateContentDto) {
    try {
      await this.contentModel.create(payload);
      return { message: 'Content created successfully' };
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('Content already exists');
      }
      throw error;
    }
  }

  async updateContent(payload: UpdateContentDto) {
    try {
      const { contentId } = payload;
      const data = await this.contentModel.findByIdAndUpdate(
        contentId,
        { $set: payload },
        { new: true },
      );

      if (!data) throw new NotFoundException('Content not found');
      return { message: 'Content updated successfully' };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async deleteContent(payload: DeleteContentDto) {
    try {
      const { contentId } = payload;
      const res = await this.contentModel.findByIdAndDelete(contentId);
      if (!res) throw new NotFoundException('Content not found');

      return { message: 'Content deleted successfully' };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getContentDetail(payload: GetContentDto) {
    try {
      const { contentId } = payload;
      const content = await this.contentModel.findById(contentId).lean();

      if (!content) throw new NotFoundException('Content not found');

      return content;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getAllContent(query: ListContentDto) {
    try {
      const { page = 1, limit = 15 } = query;
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        this.contentModel
          .find({}, { name: 1, createdAt: 1 })
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean(),

        this.contentModel.countDocuments(),
      ]);

      return {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
