import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { RolesGuard, AuthGuard } from 'src/common/guards';
import { GetUser, Roles } from 'src/common/decorators';
import { ROLE } from 'src/common/constants';
import { User } from './schema';
import { DeleteUserDto, UpdateUserDto } from './dto';

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('me')
  @Roles(ROLE.ADMIN, ROLE.USER)
  getProfile(@GetUser() user: User) {
    return this.userService.getProfile(user);
  }

  @Post('update')
  @Roles(ROLE.ADMIN, ROLE.USER)
  updateUser(@Body() payload: UpdateUserDto) {
    return this.userService.updateUser(payload);
  }

  @Post('delete')
  @Roles(ROLE.ADMIN, ROLE.USER)
  async deleteUser(@Body() payload: DeleteUserDto) {
    return await this.userService.softDeleteUser(payload);
  }
}
