import {
  Controller,
  Post,
  Body,
  UsePipes,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TreasureService } from './treasure.service';
import { CreateTreasureDto } from './dto/create-treasure.dto';
import { UpdateTreasureDto } from './dto/update-treasure.dto';
import {
  CollectTreasureDto,
  DeleteTreasureDto,
  GetCollectedTreasuresByUserDto,
  GetTreasureDto,
  GetTreasuresQueryDto,
} from './dto';
import { DefaultPaginationPipe } from 'src/common/validations';
import { AuthGuard, RolesGuard } from 'src/common/guards';
import { GetUser, Roles } from 'src/common/decorators';
import { ROLE } from 'src/common/constants';
import { User } from 'src/user/schema';

@Controller('treasures')
@UseGuards(AuthGuard, RolesGuard)
export class TreasureController {
  constructor(private readonly treasureService: TreasureService) {}

  @Post('create')
  @Roles(ROLE.ADMIN, ROLE.USER)
  createTreasure(@GetUser() user: User, @Body() payload: CreateTreasureDto) {
    return this.treasureService.createTreasure(user, payload);
  }

  @Post('detail')
  @Roles(ROLE.ADMIN, ROLE.USER)
  getTreasureDetail(@Body() payload: GetTreasureDto) {
    return this.treasureService.getTreasureDetail(payload);
  }

  @Post('all')
  @Roles(ROLE.ADMIN, ROLE.USER)
  @UsePipes(DefaultPaginationPipe)
  getAllTreasures(@GetUser() user: User, @Query() query: GetTreasuresQueryDto) {
    return this.treasureService.getAllTreasures(user, query);
  }

  @Post('update')
  @Roles(ROLE.ADMIN, ROLE.USER)
  update(@Body() payload: UpdateTreasureDto) {
    return this.treasureService.updateTreasure(payload);
  }

  @Post('delete')
  @Roles(ROLE.ADMIN, ROLE.USER)
  delete(@Body() payload: DeleteTreasureDto) {
    return this.treasureService.deleteTreasure(payload);
  }

  @Post('collect')
  @Roles(ROLE.ADMIN, ROLE.USER)
  collectTreasure(@Body() payload: CollectTreasureDto) {
    return this.treasureService.collectTreasure(payload);
  }

  @Post('collected/user')
  @Roles(ROLE.ADMIN, ROLE.USER)
  @UsePipes(DefaultPaginationPipe)
  getCollectedTreasuresByUser(
    @Query() query,
    @Body() payload: GetCollectedTreasuresByUserDto,
  ) {
    return this.treasureService.getCollectedTreasuresByUser(query, payload);
  }
}
