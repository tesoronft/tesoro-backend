import {
  Injectable,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { UploadImageDto, UploadFolder } from './dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly maxFileSize: number = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes: string[] = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
  ];

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME is required in environment variables');
    }

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required in environment variables',
      );
    }

    this.bucketName = bucketName;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log(`S3 Client initialized for bucket: ${this.bucketName}`);
  }

  /**
   * Validates if the file is a valid image
   */
  private validateImageFile(file: Express.Multer.File): void {
    // Check if file exists
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Additional validation: Check file extension
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`,
      );
    }
  }

  /**
   * Generates a unique file name
   */
  private generateFileName(
    originalName: string,
    folder: UploadFolder,
  ): string {
    const timestamp = Date.now();
    const uuid = uuidv4();
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    return `${folder}/${timestamp}-${uuid}.${extension}`;
  }

  /**
   * Uploads a single image to S3
   */
  async uploadImage(
    file: Express.Multer.File,
    dto: UploadImageDto,
  ): Promise<{ url: string; key: string }> {
    try {
      // Validate file
      this.validateImageFile(file);

      // Generate unique file name
      const fileName = this.generateFileName(file.originalname, dto.folder);

      // Prepare S3 upload parameters
      // Note: ACL removed because bucket has "Block public ACLs" enabled
      // Public access is handled via bucket policy instead
      const uploadParams: any = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL removed - use bucket policy for public access
      };

      // Upload to S3
      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);

      // Generate public URL
      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;

      this.logger.log(`Image uploaded successfully: ${fileName}`);

      return {
        url,
        key: fileName,
      };
    } catch (error) {
      this.logger.error(`Error uploading image: ${error.message}`, error.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to upload image. Please try again.',
      );
    }
  }

  /**
   * Uploads multiple images to S3
   */
  async uploadMultipleImages(
    files: Express.Multer.File[],
    dto: UploadImageDto,
  ): Promise<{ urls: string[]; keys: string[] }> {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('No files provided');
      }

      // Validate all files
      files.forEach((file) => this.validateImageFile(file));

      // Upload all files
      const uploadPromises = files.map((file) => this.uploadImage(file, dto));
      const results = await Promise.all(uploadPromises);

      const urls = results.map((result) => result.url);
      const keys = results.map((result) => result.key);

      this.logger.log(
        `Successfully uploaded ${files.length} image(s) to ${dto.folder}`,
      );

      return {
        urls,
        keys,
      };
    } catch (error) {
      this.logger.error(
        `Error uploading multiple images: ${error.message}`,
        error.stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to upload images. Please try again.',
      );
    }
  }

  /**
   * Deletes an image from S3
   */
  async deleteImage(imageKey: string): Promise<void> {
    try {
      if (!imageKey) {
        throw new BadRequestException('Image key is required');
      }

      const deleteParams = {
        Bucket: this.bucketName,
        Key: imageKey,
      };

      const command = new DeleteObjectCommand(deleteParams);
      await this.s3Client.send(command);

      this.logger.log(`Image deleted successfully: ${imageKey}`);
    } catch (error) {
      this.logger.error(
        `Error deleting image: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to delete image. Please try again.',
      );
    }
  }

  /**
   * Updates an image: deletes old image and uploads new one
   */
  async updateImage(
    file: Express.Multer.File,
    dto: UploadImageDto,
    oldImageKey?: string,
  ): Promise<{ url: string; key: string; deleted: boolean }> {
    try {
      // Validate new file
      this.validateImageFile(file);

      // Upload new image first
      const uploadResult = await this.uploadImage(file, dto);

      // Delete old image if provided
      let deleted = false;
      if (oldImageKey && oldImageKey.trim()) {
        try {
          await this.deleteImage(oldImageKey);
          deleted = true;
        } catch (deleteError) {
          // Log error but don't fail the update if old image deletion fails
          this.logger.warn(
            `Failed to delete old image ${oldImageKey}, but new image uploaded successfully`,
          );
        }
      }

      return {
        url: uploadResult.url,
        key: uploadResult.key,
        deleted,
      };
    } catch (error) {
      this.logger.error(
        `Error updating image: ${error.message}`,
        error.stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to update image. Please try again.',
      );
    }
  }
}

