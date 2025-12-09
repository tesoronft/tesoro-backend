import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema';
import { Model, Types } from 'mongoose';
import { UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { Treasure } from 'src/treasure/schema';
import { Tip } from 'src/tip/schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Treasure.name) private treasureModel: Model<Treasure>,
    @InjectModel(Tip.name) private tipModel: Model<Tip>,
    private readonly config: ConfigService,
  ) {}

  async getProfile(payload: User): Promise<any> {
    try {
      const { _id } = payload;
      const userId = new Types.ObjectId(_id);

      const data = await this.userModel
        .findById(userId)
        .select('_id name email role createdAt updatedAt')
        .lean();

      if (!data) throw new NotFoundException('User not found');

      const [totalTreasuresPosted, totalTreasuresCollected] = await Promise.all(
        [
          this.treasureModel.countDocuments({ postedBy: userId }),
          this.treasureModel.countDocuments({ collectedBy: userId }),
        ],
      );

      const [totalTipsGivenAmountAgg, totalTipsReceivedAmountAgg] =
        await Promise.all([
          this.tipModel.aggregate([
            { $match: { givenUser: userId } },
            { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
          ]),
          this.tipModel.aggregate([
            { $match: { receivedUser: userId } },
            { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
          ]),
        ]);

      const totalTipsGivenAmount = totalTipsGivenAmountAgg[0]?.totalAmount || 0;
      const totalTipsReceivedAmount =
        totalTipsReceivedAmountAgg[0]?.totalAmount || 0;

      return {
        ...data,
        totalTreasuresPosted,
        totalTreasuresCollected,
        totalTipsGivenAmount,
        totalTipsReceivedAmount,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updateUser(payload: UpdateUserDto): Promise<any> {
    try {
      const { userId, name, currentPassword, newPassword } = payload;

      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (newPassword) {
        if (!currentPassword) {
          throw new ForbiddenException(
            'Current password is required to set a new password',
          );
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          throw new ForbiddenException('Current password is incorrect');
        }

        const saltRounds = parseInt(this.config.get('SALT_ROUNDS') || '10');
        user.password = await bcrypt.hash(newPassword, saltRounds);
      }

      if (name) {
        user.name = name;
      }

      const updatedUser = await user.save();

      const obj = updatedUser.toObject();
      return {
        message: 'User updated successfully',
        data: {
          _id: obj._id,
          name: obj.name,
          email: obj.email,
          role: obj.role,
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
