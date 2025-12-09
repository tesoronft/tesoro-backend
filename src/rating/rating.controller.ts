import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto';
import { AuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { ROLE } from 'src/common/constants';

@Controller('ratings')
@UseGuards(AuthGuard, RolesGuard)
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  @Roles(ROLE.ADMIN, ROLE.USER)
  createRating(@Body() payload: CreateRatingDto) {
    return this.ratingService.createRating(payload);
  }
}
