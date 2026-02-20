import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { UploadImageDto, UpdateImageDto } from './dto';
import { AuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { ROLE } from 'src/common/constants';
import { memoryStorage } from 'multer';

// Configure multer to use memory storage
const multerConfig = {
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};

@Controller('upload')
@UseGuards(AuthGuard, RolesGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload a single image
   * POST /api/upload/image
   * Body: { folder: 'user-profiles' | 'treasures' }
   * File: image file in 'image' field
   */
  @Post('image')
  @Roles(ROLE.ADMIN, ROLE.USER)
  @UseInterceptors(FileInterceptor('image', multerConfig))
  async uploadSingleImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadImageDto,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const result = await this.uploadService.uploadImage(file, dto);

    return {
      message: 'Image uploaded successfully',
      data: result,
    };
  }

  /**
   * Upload multiple images
   * POST /api/upload/images
   * Body: { folder: 'user-profiles' | 'treasures' }
   * Files: image files in 'images' field (array)
   */
  @Post('images')
  @Roles(ROLE.ADMIN, ROLE.USER)
  @UseInterceptors(FilesInterceptor('images', 10, multerConfig)) // Max 10 images
  async uploadMultipleImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadImageDto,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image file is required');
    }

    const result = await this.uploadService.uploadMultipleImages(files, dto);

    return {
      message: `${files.length} image(s) uploaded successfully`,
      data: result,
    };
  }

  /**
   * Update image: Delete old image and upload new one
   * POST /api/upload/image/update
   * Body: { folder: 'user-profiles' | 'treasures', oldImageKey: 'user-profiles/123-abc.jpg' }
   * File: new image file in 'image' field
   */
  @Post('image/update')
  @Roles(ROLE.ADMIN, ROLE.USER)
  @UseInterceptors(FileInterceptor('image', multerConfig))
  async updateImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateImageDto,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const result = await this.uploadService.updateImage(
      file,
      { folder: dto.folder },
      dto.oldImageKey,
    );

    return {
      message: 'Image updated successfully',
      data: result,
    };
  }

  /**
   * Delete an image from S3
   * POST /api/upload/image/delete
   * Body: { imageKey: 'user-profiles/123-abc.jpg' }
   */
  @Post('image/delete')
  @Roles(ROLE.ADMIN, ROLE.USER)
  async deleteImage(@Body() body: { imageKey: string }) {
    if (!body.imageKey) {
      throw new BadRequestException('imageKey is required');
    }

    await this.uploadService.deleteImage(body.imageKey);

    return {
      message: 'Image deleted successfully',
    };
  }
}

