import { Body, Controller, Post, Query, UseGuards } from '@nestjs/common';
import { ConditionService } from './condition.service';
import { GetUser, Roles } from 'src/common/decorators';
import { ROLE } from 'src/common/constants';
import { User } from 'src/user/schema';
import { ConditionDto, CreateConditionDto, UpdateConditionDto } from './dto';
import { AuthGuard, RolesGuard } from 'src/common/guards';

@Controller('conditions')
@UseGuards(AuthGuard, RolesGuard)
export class ConditionController {
  constructor(private readonly conditionService: ConditionService) {}

  @Post('create')
  @Roles(ROLE.ADMIN)
  createCondition(
    @GetUser() user: User,
    @Body() createConditionDto: CreateConditionDto,
  ) {
    return this.conditionService.createCondition(user, createConditionDto);
  }

  @Post('details')
  @Roles(ROLE.ADMIN, ROLE.USER)
  getConditionDetails(@Body() payload: ConditionDto) {
    return this.conditionService.getConditionDetails(payload);
  }

  @Post('all')
  @Roles(ROLE.ADMIN, ROLE.USER)
  getAllConditions(@Query() query) {
    return this.conditionService.getAllConditions(query);
  }

  @Post('update')
  @Roles(ROLE.ADMIN)
  updateCondition(@Body() payload: UpdateConditionDto) {
    return this.conditionService.updateCondition(payload);
  }

  @Post('delete')
  @Roles(ROLE.ADMIN)
  deleteCondition(@Body() payload: ConditionDto) {
    return this.conditionService.deleteCondition(payload);
  }
}
