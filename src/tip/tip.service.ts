import { Injectable } from '@nestjs/common';
import { CreateTipDto } from './dto/create-tip.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Tip } from './schema';
import { Model, Types } from 'mongoose';
import { GetTipDto, GetTipsQueryDto } from './dto';

@Injectable()
export class TipService {
  constructor(@InjectModel(Tip.name) private tipModel: Model<Tip>) {}

  async createTip(payload: CreateTipDto): Promise<any> {
    const tip = await this.tipModel.create({
      givenUser: new Types.ObjectId(payload.givenUser),
      receivedUser: new Types.ObjectId(payload.receivedUser),
      treasure: new Types.ObjectId(payload.treasure),
      amount: payload.amount,
    });

    return {
      message: 'Tip has been successfully recorded.',
      data: tip,
    };
  }

  async getGivenTips(
    query: { page?: number; limit?: number },
    payload: GetTipDto,
  ): Promise<any> {
    try {
      const { userId } = payload;
      const page = query.page ? Number(query.page) : 1;
      const limit = query.limit ? Number(query.limit) : 15;
      const skip = (page - 1) * limit;

      const filter = { givenUser: new Types.ObjectId(userId) };

      const [tips, total] = await Promise.all([
        this.tipModel
          .find(filter)
          .populate({ path: 'receivedUser', select: 'name email' })
          .populate({ path: 'treasure', select: '_id title location' })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        this.tipModel.countDocuments(filter),
      ]);

      const cleanedTips = tips.map((tip: any) => {
        const { _id, __v, updatedAt, givenUser, ...rest } = tip;
        return rest;
      });

      return {
        data: cleanedTips,
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

  async getReceivedTips(
    query: { page?: number; limit?: number },
    payload: GetTipDto,
  ): Promise<any> {
    try {
      const { userId } = payload;
      const page = query.page ? Number(query.page) : 1;
      const limit = query.limit ? Number(query.limit) : 15;
      const skip = (page - 1) * limit;

      const filter = { receivedUser: new Types.ObjectId(userId) };

      const [tips, total] = await Promise.all([
        this.tipModel
          .find(filter)
          .populate({ path: 'givenUser', select: 'name email' })
          .populate({ path: 'treasure', select: '_id title location' })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        this.tipModel.countDocuments(filter),
      ]);

      const cleanedTips = tips.map((tip: any) => {
        const { _id, __v, updatedAt, receivedUser, ...rest } = tip;
        return rest;
      });

      return {
        data: cleanedTips,
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

  async getAllTips(query: GetTipsQueryDto) {
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

      const result = await this.tipModel.aggregate(pipeline);

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
