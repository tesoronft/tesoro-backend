import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema';
import { Model, Types } from 'mongoose';
import { CreateUserDto, DeleteUserDto, GetUsersQueryDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { Treasure } from 'src/treasure/schema';
import { Tip } from 'src/tip/schema';
import { ROLE } from 'src/common/constants';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Treasure.name) private treasureModel: Model<Treasure>,
    @InjectModel(Tip.name) private tipModel: Model<Tip>,
    private readonly config: ConfigService,
  ) { }

  async createUser(payload: CreateUserDto): Promise<any> {
    try {
      const { email, password, role } = payload;
      const userExists = await this.userModel.findOne({ email });
      if (userExists) {
        throw new BadRequestException('User already exists');
      }

      const saltRounds = parseInt(this.config.get('SALT_ROUNDS') || '10');
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = await this.userModel.create({
        ...payload,
        password: hashedPassword,
        role: role || ROLE.USER,
      });

      const obj = newUser.toObject();
      const { password: _p, ...result } = obj;

      return {
        message: 'User created successfully',
        data: result,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getProfile(payload: User): Promise<any> {
    try {
      const { _id } = payload;
      const userId = new Types.ObjectId(_id);

      const data = await this.userModel
        .findById(userId)
        .select('_id name email profileImage role createdAt updatedAt')
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
      const {
        userId,
        name,
        profileImage,
        currentPassword,
        newPassword,
        isBlocked,
        isDeleted,
      } = payload;

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

      if (isBlocked === true || isBlocked === false) {
        user.isBlocked = isBlocked;
      }

      if (isDeleted === true || isDeleted === false) {
        user.isDeleted = isDeleted;
      }

      if (profileImage) {
        user.profileImage = profileImage;
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
          profileImage: obj.profileImage,
          isBlocked: obj.isBlocked,
          isDeleted: obj.isDeleted,
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async softDeleteUser(payload: DeleteUserDto): Promise<any> {
    try {
      const { userId, password } = payload;
      const user = await this.userModel.findById(userId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.password) {
        if (!password)
          throw new BadRequestException('Password is required for this user');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new BadRequestException('Invalid password');
      }

      user.isDeleted = true;
      await user.save();

      return { message: 'User deleted successfully' };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getAllUsers(query: GetUsersQueryDto) {
    try {
      const { page = 1, limit = 15, search, isPremium } = query;

      const skip = (page - 1) * limit;

      const filter: any = { isDeleted: false };

      // 🔍 Search by name OR email
      if (search?.trim()) {
        const regex = { $regex: search.trim(), $options: 'i' };
        filter.$or = [{ name: regex }, { email: regex }];
      }

      // ⭐ Premium filter
      if (isPremium === 'true') {
        filter.isPremium = true;
      }

      const [users, total] = await Promise.all([
        this.userModel
          .find(filter)
          .select('name email profileImage isPremium isBlocked isDeleted createdAt')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean(),

        this.userModel.countDocuments(filter),
      ]);

      return {
        users,
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
