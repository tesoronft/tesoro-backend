import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { CreateTreasureDto } from './dto/create-treasure.dto';
import { UpdateTreasureDto } from './dto/update-treasure.dto';
import { Treasure, Report } from './schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DeleteTreasureDto,
  GetCollectedTreasuresByUserDto,
  GetTreasureDto,
  GetTreasuresQueryDto,
  ReportTreasureDto,
  EnableTreasureDto,
} from './dto';
import { User } from 'src/user/schema';
import { TreasureScope, ROLE } from 'src/common/constants';
import { CollectTreasureDto } from './dto';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class TreasureService {
  private readonly logger = new Logger(TreasureService.name);

  constructor(
    @InjectModel(Treasure.name) private treasureModel: Model<Treasure>,
    @InjectModel(Report.name) private reportModel: Model<Report>,
    @InjectModel(User.name) private userModel: Model<User>,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async createTreasure(user: User, payload: CreateTreasureDto): Promise<any> {
    try {
      const treasure = await this.treasureModel.create({
        ...payload,
        postedBy: new Types.ObjectId(user._id),
        category: new Types.ObjectId(payload.category),
        condition: new Types.ObjectId(payload.condition),

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

  async getTreasureDetail(user: User, payload: GetTreasureDto): Promise<any> {
    try {
      const { treasureId } = payload;

      // Build match condition based on user role
      const matchCondition: any = {
        _id: new Types.ObjectId(treasureId),
      };

      // Only filter disabled treasures for non-admin users
      if (user.role !== ROLE.ADMIN) {
        matchCondition.isDisable = { $ne: true };
      }

      const result = await this.treasureModel.aggregate([
        {
          $match: matchCondition,
        },

        // postedBy
        {
          $lookup: {
            from: 'users',
            localField: 'postedBy',
            foreignField: '_id',
            as: 'postedByInfo',
          },
        },
        { $unwind: '$postedByInfo' },

        // ratings
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

        // category
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryInfo',
          },
        },
        {
          $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true },
        },

        // condition
        {
          $lookup: {
            from: 'conditions',
            localField: 'conditionObjId',
            foreignField: '_id',
            as: 'conditionInfo',
          },
        },
        {
          $unwind: { path: '$conditionInfo', preserveNullAndEmptyArrays: true },
        },

        // collectedBy
        {
          $lookup: {
            from: 'users',
            localField: 'collectedBy',
            foreignField: '_id',
            as: 'collectedByInfo',
          },
        },
        {
          $unwind: {
            path: '$collectedByInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        // collectedBy ratings
        {
          $lookup: {
            from: 'ratings',
            let: { userId: '$collectedByInfo._id' },
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
            as: 'collectedByRatingInfo',
          },
        },

        // final shape
        {
          $addFields: {
            postedBy: {
              _id: '$postedByInfo._id',
              name: '$postedByInfo.name',
              profileImage: '$postedByInfo.profileImage',
              rating: {
                $ifNull: [
                  {
                    $round: [
                      { $arrayElemAt: ['$ratingInfo.averageRating', 0] },
                      1,
                    ],
                  },
                  0,
                ],
              },
            },
            collectedBy: {
              $cond: {
                if: { $ifNull: ['$collectedBy', false] },
                then: {
                  // Only populate if collectedBy exists
                  _id: '$collectedByInfo._id',
                  name: '$collectedByInfo.name',
                  profileImage: '$collectedByInfo.profileImage',
                  rating: {
                    $ifNull: [
                      {
                        $round: [
                          {
                            $arrayElemAt: [
                              '$collectedByRatingInfo.averageRating',
                              0,
                            ],
                          },
                          1,
                        ],
                      },
                      0,
                    ],
                  },
                },
                else: null,
              },
            },
            category: {
              _id: '$categoryInfo._id',
              name: '$categoryInfo.name',
            },
            condition: {
              _id: '$conditionInfo._id',
              name: '$conditionInfo.name',
            },
          },
        },

        {
          $project: {
            postedByInfo: 0,
            ratingInfo: 0,
            categoryInfo: 0,
            conditionInfo: 0,
            collectedByInfo: 0,
            collectedByRatingInfo: 0,
          },
        },
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
        collected,
      } = query;

      const skip = (page - 1) * limit;

      const filter: any = {};

      // Only filter disabled treasures for non-admin users
      if (user.role !== ROLE.ADMIN) {
        filter.isDisable = { $ne: true };
      }

      if (scope === TreasureScope.MINE) {
        filter.postedBy = new Types.ObjectId(user._id);
      } else {
        filter.postedBy = { $ne: new Types.ObjectId(user._id) };
      }

      if (category) filter.category = new Types.ObjectId(category);
      if (condition) filter.condition = new Types.ObjectId(condition);

      if (query.collected === 'true') {
        filter.collectedBy = { $ne: null };
      } else if (query.collected === 'false') {
        filter.collectedBy = null;
      }

      if (searchBy?.trim()) {
        const regex = { $regex: searchBy.trim(), $options: 'i' };
        filter.$or = [
          { title: regex },
          { brand: regex },
          { itemModel: regex },
          { description: regex },
        ];
      }

      const basePipeline: any[] = [
        { $match: filter },

        {
          $lookup: {
            from: 'users',
            localField: 'postedBy',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },

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

        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryInfo',
          },
        },
        {
          $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true },
        },

        {
          $lookup: {
            from: 'conditions',
            localField: 'condition',
            foreignField: '_id',
            as: 'conditionInfo',
          },
        },
        {
          $unwind: { path: '$conditionInfo', preserveNullAndEmptyArrays: true },
        },

        // collectedBy
        {
          $lookup: {
            from: 'users',
            localField: 'collectedBy',
            foreignField: '_id',
            as: 'collectedByInfo',
          },
        },
        {
          $unwind: {
            path: '$collectedByInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        // collectedBy ratings
        {
          $lookup: {
            from: 'ratings',
            let: { userId: '$collectedByInfo._id' },
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
            as: 'collectedByRatingInfo',
          },
        },

        {
          $addFields: {
            postedBy: {
              _id: '$user._id',
              name: '$user.name',
              profileImage: '$user.profileImage',
              rating: {
                $ifNull: [
                  { $round: [{ $arrayElemAt: ['$rating.avgRating', 0] }, 1] },
                  0,
                ],
              },
            },
            category: {
              _id: '$categoryInfo._id',
              name: '$categoryInfo.name',
            },
            condition: {
              _id: '$conditionInfo._id',
              name: '$conditionInfo.name',
            },
            collectedBy: {
              $cond: {
                if: { $ifNull: ['$collectedBy', false] },
                then: {
                  // Only populate if collectedBy exists
                  _id: '$collectedByInfo._id',
                  name: '$collectedByInfo.name',
                  profileImage: '$collectedByInfo.profileImage',
                  rating: {
                    $ifNull: [
                      {
                        $round: [
                          {
                            $arrayElemAt: [
                              '$collectedByRatingInfo.averageRating',
                              0,
                            ],
                          },
                          1,
                        ],
                      },
                      0,
                    ],
                  },
                },
                else: null,
              },
            },
          },
        },

        {
          $project: {
            user: 0,
            rating: 0,
            categoryInfo: 0,
            conditionInfo: 0,
            collectedByInfo: 0,
            collectedByRatingInfo: 0,
            __v: 0,
          },
        },
      ];

      const useGeo =
        longitude !== undefined &&
        latitude !== undefined &&
        distance !== undefined;

      if (useGeo) {
        const distanceInMeters = distance * 1609.34;

        const pipeline = [
          {
            $geoNear: {
              near: { type: 'Point', coordinates: [longitude, latitude] },
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

        const countPipeline: any = [
          {
            $geoNear: {
              near: { type: 'Point', coordinates: [longitude, latitude] },
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

  async getMarkers(user: User, query: GetTreasuresQueryDto): Promise<any> {
    try {
      const {
        page = 1,
        limit = 15,
        longitude,
        latitude,
        distance,
        scope = TreasureScope.ALL,
      } = query;

      const skip = (page - 1) * limit;

      /* -------------------- BASE FILTER -------------------- */
      const filterConditions: any[] = [];

      // Only filter disabled treasures for non-admin users
      if (user.role !== ROLE.ADMIN) {
        filterConditions.push({ isDisable: { $ne: true } });
      }

      if (scope === TreasureScope.MINE) {
        filterConditions.push({ postedBy: new Types.ObjectId(user._id) });
      } else {
        // 🔥 Exclude current user's treasures
        filterConditions.push({
          postedBy: { $ne: new Types.ObjectId(user._id) },
        });
      }

      // Only return treasures that are not collected (collectedBy is null or doesn't exist)
      filterConditions.push({
        $or: [{ collectedBy: null }, { collectedBy: { $exists: false } }],
      });

      const filter: any = { $and: filterConditions };

      /* -------------------- COMMON PIPELINE -------------------- */
      const basePipeline: any[] = [
        { $match: filter },
        {
          $project: {
            _id: 1,
            coordinates: '$location.coordinates',
          },
        },
      ];

      /* -------------------- GEO QUERY -------------------- */
      const useGeo =
        longitude !== undefined &&
        latitude !== undefined &&
        distance !== undefined;

      if (useGeo) {
        const distanceInMeters = distance * 1609.34; //In miles.if km then 1000

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

        const countPipeline: any = [
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

        const [markers, totalResult] = await Promise.all([
          this.treasureModel.aggregate(pipeline),
          this.treasureModel.aggregate(countPipeline),
        ]);

        const total = totalResult[0]?.total || 0;

        return {
          markers,
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
      const { treasureId, location, category, condition, ...updateFields } =
        payload;

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
      if (condition) {
        (updateFields as any).condition = new Types.ObjectId(condition);
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

  /**
   * Permanently delete uncollected treasures that are older than specified hours (default 72 hours)
   * This method is called by cron job every 30 minutes
   * Uses batch processing for efficiency with multiple treasures
   * WARNING: This performs hard delete - treasures will be permanently removed from database
   */
  async deleteUncollectedTreasures(): Promise<{
    deletedCount: number;
    success: boolean;
  }> {
    try {
      // Get cleanup hours from environment variable, default to 72 hours
      const cleanupHours =
        this.configService.get<number>('TREASURE_CLEANUP_HOURS') || 72;

      // Calculate the cutoff date (72 hours ago from now)
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - cleanupHours);

      this.logger.log(
        `Starting cleanup of uncollected treasures older than ${cleanupHours} hours (before ${cutoffDate.toISOString()})`,
      );

      // Use aggregation pipeline to find treasures that should be deleted
      // Conditions:
      // 1. createdAt is older than cutoffDate
      // 2. collectedBy is null (not collected)
      // 3. postedBy user's isPremium is false or doesn't exist
      const treasuresToDelete = await this.treasureModel.aggregate([
        {
          $match: {
            createdAt: { $lt: cutoffDate },
            collectedBy: null,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'postedBy',
            foreignField: '_id',
            as: 'userInfo',
          },
        },
        {
          $unwind: {
            path: '$userInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $or: [
              { 'userInfo.isPremium': { $ne: true } }, // isPremium is false or null
              { userInfo: null }, // User doesn't exist or wasn't found
              { userInfo: { $exists: false } }, // UserInfo field doesn't exist
            ],
          },
        },
        {
          $project: {
            _id: 1,
          },
        },
      ]);

      // Extract treasure IDs to delete
      const treasureIdsToDelete = treasuresToDelete.map((t) => t._id);

      let deletedCount = 0;

      if (treasureIdsToDelete.length > 0) {
        // Delete treasures in batch
        const result = await this.treasureModel.deleteMany({
          _id: { $in: treasureIdsToDelete },
        });

        deletedCount = result.deletedCount;
      }

      if (deletedCount > 0) {
        this.logger.log(
          `Successfully permanently deleted ${deletedCount} uncollected treasure(s) older than ${cleanupHours} hours`,
        );
      } else {
        this.logger.debug(
          `No uncollected treasures found older than ${cleanupHours} hours`,
        );
      }

      return {
        deletedCount,
        success: true,
      };
    } catch (error) {
      this.logger.error(
        `Error during treasure cleanup: ${error.message}`,
        error.stack,
      );
      return {
        deletedCount: 0,
        success: false,
      };
    }
  }

  /**
   * Cron job that runs every 30 minutes to clean up uncollected treasures
   * This ensures treasures are deleted within 30 minutes of reaching 72 hours
   */
  @Cron('*/30 * * * *', {
    name: 'delete-uncollected-treasures',
    timeZone: 'UTC',
  })
  async handleTreasureCleanupCron(): Promise<void> {
    this.logger.log('Cron job triggered: Starting treasure cleanup...');
    const result = await this.deleteUncollectedTreasures();

    if (result.success) {
      this.logger.log(
        `Cron job completed: ${result.deletedCount} treasure(s) deleted`,
      );
    } else {
      this.logger.warn('Cron job completed with errors');
    }
  }

  /**
   * Report a treasure for inappropriate content
   * Creates a report record and disables the treasure
   */
  async reportTreasure(user: User, payload: ReportTreasureDto): Promise<any> {
    try {
      const { treasureId, reason, description } = payload;

      // Check if treasure exists
      const treasure = await this.treasureModel.findById(treasureId);
      if (!treasure) {
        throw new NotFoundException('Treasure not found');
      }

      // Check if user has already reported this treasure
      const existingReport = await this.reportModel.findOne({
        treasureId: new Types.ObjectId(treasureId),
        reportedBy: new Types.ObjectId(user._id),
      });

      if (existingReport) {
        throw new BadRequestException(
          'You have already reported this treasure',
        );
      }

      // Create report record
      const report = await this.reportModel.create({
        treasureId: new Types.ObjectId(treasureId),
        reportedBy: new Types.ObjectId(user._id),
        reason: reason.trim(),
        description: description?.trim() || '',
      });

      // Disable the treasure
      await this.treasureModel.findByIdAndUpdate(treasureId, {
        $set: { isDisable: true },
      });

      // Get the user who posted the treasure to send email notification
      const postedByUser = await this.userModel.findById(treasure.postedBy);

      if (postedByUser && postedByUser.email) {
        try {
          await this.emailService.sendTreasureReportedEmail(
            postedByUser.email,
            postedByUser.name,
            treasure.title,
            reason,
            description?.trim() || undefined,
          );
          this.logger.log(
            `Email notification sent to ${postedByUser.email} for reported treasure`,
          );
        } catch (emailError) {
          // Log email error but don't fail the report operation
          this.logger.error(
            `Failed to send email notification: ${emailError.message}`,
            emailError.stack,
          );
        }
      }

      this.logger.log(`Treasure ${treasureId} reported by admin and disabled`);

      return {
        message: 'Treasure reported successfully and has been disabled',
        data: {
          reportId: report._id,
          treasureId: treasureId,
          isDisable: true,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error reporting treasure: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Enable or disable a treasure
   * When enabling (isDisable: false), update report status to 'resolved' for audit trail
   * We don't delete report records to maintain history
   */
  async enableDisableTreasure(payload: EnableTreasureDto): Promise<any> {
    try {
      const { treasureId, isDisable } = payload;

      // Check if treasure exists
      const treasure = await this.treasureModel.findById(treasureId);
      if (!treasure) {
        throw new NotFoundException('Treasure not found');
      }

      // Update treasure isDisable status
      const updatedTreasure = await this.treasureModel.findByIdAndUpdate(
        treasureId,
        {
          $set: { isDisable: isDisable },
        },
        { new: true },
      );

      // If treasure is being enabled (isDisable: false), update report status to 'resolved'
      // We keep the report record for audit trail but mark it as resolved
      if (!isDisable) {
        await this.reportModel.deleteMany({
          treasureId: new Types.ObjectId(treasureId),
        });

        this.logger.log(
          `Treasure ${treasureId} enabled and related reports deleted`,
        );
      } else {
        this.logger.log(`Treasure ${treasureId} disabled`);
      }

      return {
        message: `Treasure ${isDisable ? 'disabled' : 'enabled'} successfully`,
        data: {
          treasureId: treasureId,
          isDisable: isDisable,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error enabling/disabling treasure: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
