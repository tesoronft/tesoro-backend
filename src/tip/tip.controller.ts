import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UsePipes,
} from '@nestjs/common';
import { TipService } from './tip.service';
import { CreateTipDto } from './dto/create-tip.dto';
import { AuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { ROLE } from 'src/common/constants';
import { GetTipDto } from './dto';
import { DefaultPaginationPipe } from 'src/common/validations';

@Controller('tips')
@UseGuards(AuthGuard, RolesGuard)
export class TipController {
  constructor(private readonly tipService: TipService) {}

  @Post('create')
  @Roles(ROLE.ADMIN, ROLE.USER)
  async createTip(@Body() payload: CreateTipDto) {
    return this.tipService.createTip(payload);
  }

  @Post('given')
  @Roles(ROLE.ADMIN, ROLE.USER)
  @UsePipes(DefaultPaginationPipe)
  async getGivenTips(@Query() query, @Body() payload: GetTipDto) {
    return this.tipService.getGivenTips(query, payload);
  }

  @Post('received')
  @Roles(ROLE.ADMIN, ROLE.USER)
  @UsePipes(DefaultPaginationPipe)
  async getReceivedTips(@Query() query, @Body() payload: GetTipDto) {
    return this.tipService.getReceivedTips(query, payload);
  }
}
