import {
  Body,
  Controller,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ContentService } from './content.service';
import {
  CreateContentDto,
  DeleteContentDto,
  GetContentDto,
  ListContentDto,
  UpdateContentDto,
} from './dto';
import { DefaultPaginationPipe } from 'src/common/validations';
import { AuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { ROLE } from 'src/common/constants';

@Controller('contents')
@UseGuards(AuthGuard, RolesGuard)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post('create')
  @Roles(ROLE.ADMIN)
  createContent(@Body() payload: CreateContentDto) {
    return this.contentService.createContent(payload);
  }

  @Post('update')
  @Roles(ROLE.ADMIN)
  updateContent(@Body() payload: UpdateContentDto) {
    return this.contentService.updateContent(payload);
  }

  @Post('delete')
  @Roles(ROLE.ADMIN)
  deleteContent(@Body() payload: DeleteContentDto) {
    return this.contentService.deleteContent(payload);
  }

  @Post('detail')
  @Roles(ROLE.ADMIN, ROLE.USER)
  getContentDetail(@Body() payload: GetContentDto) {
    return this.contentService.getContentDetail(payload);
  }

  @Post('all')
  @Roles(ROLE.ADMIN, ROLE.USER)
  @UsePipes(DefaultPaginationPipe)
  getAllContent(@Query() query: ListContentDto) {
    return this.contentService.getAllContent(query);
  }
}
