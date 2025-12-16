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
      const result = await this.treasureModel.aggregate([
        { $match: { _id: new Types.ObjectId(treasureId) } },

        {
          $lookup: {
            from: 'users',
            localField: 'postedBy',
            foreignField: '_id',
            as: 'postedByInfo',
          },
        },
        { $unwind: '$postedByInfo' },

        {
          $lookup: {
            from: 'ratings',
            let: { userId: '$postedByInfo._id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$user', '$$userId'] } } },
              {
                $group: {
                  _id: '$user',
                  averageRating: { $avg: '$rate' },
                  count: { $sum: 1 },
                },
              },
            ],
            as: 'ratingInfo',
          },
        },
        {
          $addFields: {
            postedBy: {
              _id: '$postedByInfo._id',
              name: '$postedByInfo.name',
              profileImage: '$postedByInfo.profileImage',
              rating: {
                $ifNull: [
                  { $arrayElemAt: ['$ratingInfo.averageRating', 0] },
                  0,
                ],
              },
            },
          },
        },

        { $project: { postedByInfo: 0, ratingInfo: 0 } },
      ]);

      if (!result || result.length === 0)
        throw new NotFoundException('Treasure not found');

      return result[0];
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

      /* -------------------- BASE FILTER -------------------- */
      const filter: any = {
        isDeleted: { $ne: true },
      };

      if (scope === TreasureScope.MINE) {
        filter.postedBy = new Types.ObjectId(user._id);
      } else {
        // 🔥 Exclude current user's treasures
        filter.postedBy = { $ne: new Types.ObjectId(user._id) };
      }

      if (category) filter.category = new Types.ObjectId(category);
      if (condition) filter.condition = condition;

      if (searchBy?.trim()) {
        const regex = { $regex: searchBy.trim(), $options: 'i' };
        filter.$or = [
          { title: regex },
          { brand: regex },
          { type: regex },
          { itemModel: regex },
          { description: regex },
        ];
      }

      /* -------------------- COMMON PIPELINE -------------------- */
      const basePipeline: any[] = [
        { $match: filter },

        // Join user
        {
          $lookup: {
            from: 'users',
            localField: 'postedBy',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },

        // Join rating
        {
          $lookup: {
            from: 'ratings',
            let: { userId: '$user._id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$user', '$$userId'] } } },
              {
                $group: {
                  _id: '$user',
                  avgRating: { $avg: '$rate' },
                  count: { $sum: 1 },
                },
              },
            ],
            as: 'rating',
          },
        },

        // Build postedBy object
        {
          $addFields: {
            postedBy: {
              _id: '$user._id',
              name: '$user.name',
              profileImage: '$user.profileImage',
              rating: {
                $ifNull: [{ $arrayElemAt: ['$rating.avgRating', 0] }, 0],
              },
            },
          },
        },

        // Cleanup
        {
          $project: {
            user: 0,
            rating: 0,
            __v: 0,
          },
        },
      ];

      /* -------------------- GEO QUERY -------------------- */
      const useGeo =
        longitude !== undefined &&
        latitude !== undefined &&
        distance !== undefined;

      if (useGeo) {
        const distanceInMeters = distance * 1609.34;   //In miles.if km then 1000

        const pipeline = [
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
          ...basePipeline.slice(1),
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
        ];

        const countPipeline:any = [
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

        const [treasures, totalResult] = await Promise.all([
          this.treasureModel.aggregate(pipeline),
          this.treasureModel.aggregate(countPipeline),
        ]);

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

      /* -------------------- NON-GEO QUERY -------------------- */
      const pipeline = [
        ...basePipeline,
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ];

      const countPipeline = [{ $match: filter }, { $count: 'total' }];

      const [treasures, totalResult] = await Promise.all([
        this.treasureModel.aggregate(pipeline),
        this.treasureModel.aggregate(countPipeline),
      ]);

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
