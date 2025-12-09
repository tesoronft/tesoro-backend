import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRatingDto } from './dto/create-rating.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Rating } from './schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class RatingService {
  constructor(@InjectModel(Rating.name) private ratingModel: Model<Rating>) {}

  async createRating(payload: CreateRatingDto) {
    try {
      const { treasureId, userId, rate } = payload;

      const rating = await this.ratingModel.findOneAndUpdate(
        {
          user: new Types.ObjectId(userId),
          treasure: new Types.ObjectId(treasureId),
        },
        {
          $set: { rate },
        },
        {
          new: true,
          upsert: true,
        },
      );

      return {
        message: 'Rating submitted successfully',
        data: rating,
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('You already rated this treasure');
      }
      throw error;
    }
  }
}
