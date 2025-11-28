import { pagination } from '../constants';
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class DefaultPaginationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const page = parseInt(value.page || pagination.DEFAULT_PAGE);
    const limit = parseInt(value.limit || pagination.DEFAULT_LIMIT);

    if (isNaN(page) || page <= 0) {
      throw new BadRequestException('Page must be a positive number.');
    }

    if (isNaN(limit) || limit <= 0) {
      throw new BadRequestException('Limit must be a positive number.');
    }

  

    return {
      ...value,
      page,
      limit,
    };
  }
}
