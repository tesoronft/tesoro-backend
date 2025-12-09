import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTreasureDto } from './dto/create-treasure.dto';
import { UpdateTreasureDto } from './dto/update-treasure.dto';
import { Treasure } from './schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DeleteTreasureDto,
  GetCollectedTreasuresByUserDto,
  GetTreasureDto,
  GetTreasuresQueryDto,
} from './dto';
import { User } from 'src/user/schema';
import { TreasureScope } from 'src/common/constants';
import { CollectTreasureDto } from './dto';

@Injectable()
export class TreasureService {
  constructor(
    @InjectModel(Treasure.name) private treasureModel: Model<Treasure>,
  ) {}

  async createTreasure(user: User, payload: CreateTreasureDto): Promise<any> {
    try {
      const treasure = await this.treasureModel.create({
        ...payload,
        postedBy: new Types.ObjectId(user._id),
        category: new Types.ObjectId(payload.category),

        location: {
          type: 'Point',
          coordinates: [payload.location.lng, payload.location.lat],
          address: payload.location.address,
          placeId: payload.location.placeId,
        },
      });

      return {
        message: 'Treasure created successfully',
        data: treasure,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getTreasureDetail(payload: GetTreasureDto): Promise<any> {
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

  async getAllTreasures(user: User, query: GetTreasuresQueryDto): Promise<any> {
    try {
      const {
        page = 1,
        limit = 15,
        searchBy,
        category,
        condition,
        longitude,
        latitude,
        distance,
        scope = TreasureScope.ALL,
      } = query;

      const skip = (page - 1) * limit;

      const filter: any = {};

      if (scope === TreasureScope.MINE) {
        filter.postedBy = new Types.ObjectId(user._id);
      }

      if (category) filter.category = new Types.ObjectId(category);
      if (condition) filter.condition = condition;

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

      const useGeo =
        longitude !== undefined &&
        latitude !== undefined &&
        distance !== undefined;

      if (useGeo) {
        const distanceInMeters = distance * 1000;

        const pipeline: any[] = [
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [longitude, latitude],
              },
              distanceField: 'distance',
              maxDistance: distanceInMeters,
              spherical: true,
              query: filter,
            },
          },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
        ];

        const treasures = await this.treasureModel.aggregate(pipeline);

        const totalPipeline: any = [
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [longitude, latitude],
              },
              distanceField: 'distance',
              maxDistance: distanceInMeters,
              spherical: true,
              query: filter,
            },
          },
          { $count: 'total' },
        ];

        const totalResult = await this.treasureModel.aggregate(totalPipeline);
        const total = totalResult[0]?.total || 0;

        return {
          treasures,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
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

  async updateTreasure(payload: UpdateTreasureDto): Promise<any> {
    try {
      const { treasureId, location, category, ...updateFields } = payload;

      if (location) {
        (updateFields as any).location = {
          type: 'Point',
          coordinates: [location.lng, location.lat],
          address: location.address ?? '',
          placeId: location.placeId ?? '',
        };
      }
      if (category) {
        (updateFields as any).category = new Types.ObjectId(category);
      }
      const data = await this.treasureModel.findByIdAndUpdate(
        treasureId,
        { $set: updateFields },
        { new: true },
      );

      if (!data) throw new NotFoundException('Treasure not found');

      return { message: 'Treasure updated successfully', data };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async deleteTreasure(payload: DeleteTreasureDto): Promise<any> {
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

  async collectTreasure(payload: CollectTreasureDto): Promise<any> {
    try {
      const { userId, treasureId } = payload;
      const treasure = await this.treasureModel.findById(treasureId);

      if (!treasure) {
        throw new NotFoundException('Treasure not found');
      }

      if (treasure.collectedBy) {
        throw new BadRequestException('Treasure already collected');
      }

      treasure.collectedBy = new Types.ObjectId(userId);
      treasure.collectedAt = new Date();

      await treasure.save();

      return {
        message: 'Treasure collected successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getCollectedTreasuresByUser(
    query: { page?: number; limit?: number },
    payload: GetCollectedTreasuresByUserDto,
  ): Promise<any> {
    try {
      const { userId } = payload;

      const page = query.page ? Number(query.page) : 1;
      const limit = query.limit ? Number(query.limit) : 15;
      const skip = (page - 1) * limit;

      const filter = {
        collectedBy: new Types.ObjectId(userId),
      };

      const [treasures, total] = await Promise.all([
        this.treasureModel
          .find(filter)
          .select('_id title category collectedAt location photos')
          .populate({ path: 'postedBy', select: 'name email' })
          .populate({ path: 'category', select: 'name' })
          .sort({ collectedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        this.treasureModel.countDocuments(filter),
      ]);

      return {
        data: treasures,
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
