import { Injectable } from '@nestjs/common';
import { CreateTipDto } from './dto/create-tip.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Tip } from './schema';
import { Model, Types } from 'mongoose';
import { GetTipDto } from './dto';

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
}
