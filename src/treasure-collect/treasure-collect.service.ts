import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TreasureCollect } from './schema';
import { User } from 'src/user/schema';
import {
  CreateTreasureCollectDto,
  GetTreasureCollectDto,
  GetTreasureCollectsQueryDto,
} from './dto';

@Injectable()
export class TreasureCollectService {
  constructor(
    @InjectModel(TreasureCollect.name)
    private treasureCollectModel: Model<TreasureCollect>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async createTreasureCollect(payload: CreateTreasureCollectDto): Promise<any> {
    const record = await this.treasureCollectModel.create({
      givenUser: new Types.ObjectId(payload.givenUser),
      receivedUser: new Types.ObjectId(payload.receivedUser),
      treasure: new Types.ObjectId(payload.treasure),
      amount: payload.amount,
    });

    // Add amount to the receivedUser's treasureAmount
    await this.userModel.findByIdAndUpdate(payload.receivedUser, {
      $inc: { treasureAmount: payload.amount },
    });

    return {
      message: 'Treasure collect amount has been successfully recorded.',
      data: record,
    };
  }

  async getGivenTreasureCollects(
    query: { page?: number; limit?: number },
    payload: GetTreasureCollectDto,
  ): Promise<any> {
    try {
      const { userId } = payload;
      const page = query.page ? Number(query.page) : 1;
      const limit = query.limit ? Number(query.limit) : 15;
      const skip = (page - 1) * limit;

      const filter = { givenUser: new Types.ObjectId(userId) };

      const [records, total] = await Promise.all([
        this.treasureCollectModel
          .find(filter)
          .populate({ path: 'receivedUser', select: 'name email' })
          .populate({ path: 'treasure', select: '_id title location' })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        this.treasureCollectModel.countDocuments(filter),
      ]);

      const cleanedRecords = records.map((rec: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars
        const { _id, __v, updatedAt, givenUser, ...rest } = rec;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return rest;
      });

      return {
        data: cleanedRecords,
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

  async getReceivedTreasureCollects(
    query: { page?: number; limit?: number },
    payload: GetTreasureCollectDto,
  ): Promise<any> {
    try {
      const { userId } = payload;
      const page = query.page ? Number(query.page) : 1;
      const limit = query.limit ? Number(query.limit) : 15;
      const skip = (page - 1) * limit;

      const filter = { receivedUser: new Types.ObjectId(userId) };

      const [records, total] = await Promise.all([
        this.treasureCollectModel
          .find(filter)
          .populate({ path: 'givenUser', select: 'name email' })
          .populate({ path: 'treasure', select: '_id title location' })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        this.treasureCollectModel.countDocuments(filter),
      ]);

      const cleanedRecords = records.map((rec: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars
        const { _id, __v, updatedAt, receivedUser, ...rest } = rec;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return rest;
      });

      return {
        data: cleanedRecords,
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

  async getAllTreasureCollects(query: GetTreasureCollectsQueryDto) {
    try {
      const { page = 1, limit = 15 } = query;
      const skip = (page - 1) * limit;

      const pipeline: any = [
        // Given user
        {
          $lookup: {
            from: 'users',
            localField: 'givenUser',
            foreignField: '_id',
            as: 'givenUser',
          },
        },
        { $unwind: '$givenUser' },

        // Received user
        {
          $lookup: {
            from: 'users',
            localField: 'receivedUser',
            foreignField: '_id',
            as: 'receivedUser',
          },
        },
        { $unwind: '$receivedUser' },

        // Treasure
        {
          $lookup: {
            from: 'treasures',
            localField: 'treasure',
            foreignField: '_id',
            as: 'treasure',
          },
        },
        { $unwind: '$treasure' },

        // Shape response
        {
          $project: {
            amount: 1,
            createdAt: 1,

            givenUser: {
              _id: '$givenUser._id',
              name: '$givenUser.name',
              email: '$givenUser.email',
            },

            receivedUser: {
              _id: '$receivedUser._id',
              name: '$receivedUser.name',
              email: '$receivedUser.email',
            },

            treasure: {
              _id: '$treasure._id',
              title: '$treasure.title',
            },
          },
        },

        { $sort: { createdAt: -1 } },

        {
          $facet: {
            items: [{ $skip: skip }, { $limit: limit }],
            totalCount: [{ $count: 'total' }],
          },
        },
      ];

      const result = await this.treasureCollectModel.aggregate(pipeline);

      const items = result[0]?.items || [];
      const total = result[0]?.totalCount[0]?.total || 0;

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
      console.error(error);
      throw error;
    }
  }
}
