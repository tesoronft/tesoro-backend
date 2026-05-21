import {
  Controller,
  Post,
  Body,
  UseGuards,
  Query,
  UsePipes,
} from '@nestjs/common';
import { TreasureCollectService } from './treasure-collect.service';
import { CreateTreasureCollectDto } from './dto/create-treasure-collect.dto';
import { AuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { ROLE } from 'src/common/constants';
import {
  GetTreasureCollectDto,
  GetTreasureCollectsQueryDto,
} from './dto';
import { DefaultPaginationPipe } from 'src/common/validations';

@Controller('treasure-collects')
@UseGuards(AuthGuard, RolesGuard)
export class TreasureCollectController {
  constructor(
    private readonly treasureCollectService: TreasureCollectService,
  ) {}

  @Post('create')
  @Roles(ROLE.ADMIN, ROLE.USER)
  async createTreasureCollect(@Body() payload: CreateTreasureCollectDto) {
    return this.treasureCollectService.createTreasureCollect(payload);
  }

  @Post('given')
  @Roles(ROLE.ADMIN, ROLE.USER)
  @UsePipes(DefaultPaginationPipe)
  async getGivenTreasureCollects(
    @Query() query,
    @Body() payload: GetTreasureCollectDto,
  ) {
    return this.treasureCollectService.getGivenTreasureCollects(
      query,
      payload,
    );
  }

  @Post('received')
  @Roles(ROLE.ADMIN, ROLE.USER)
  @UsePipes(DefaultPaginationPipe)
  async getReceivedTreasureCollects(
    @Query() query,
    @Body() payload: GetTreasureCollectDto,
  ) {
    return this.treasureCollectService.getReceivedTreasureCollects(
      query,
      payload,
    );
  }

  @Post('all')
  @Roles(ROLE.ADMIN)
  @UsePipes(DefaultPaginationPipe)
  async getAllTreasureCollects(@Query() query: GetTreasureCollectsQueryDto) {
    return this.treasureCollectService.getAllTreasureCollects(query);
  }
}
