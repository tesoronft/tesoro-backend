import { Module } from '@nestjs/common';
import { TreasureCollectService } from './treasure-collect.service';
import { TreasureCollectController } from './treasure-collect.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TreasureCollect, TreasureCollectSchema } from './schema';
import { User, UserSchema } from 'src/user/schema';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TreasureCollect.name, schema: TreasureCollectSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [TreasureCollectController],
  providers: [TreasureCollectService],
})
export class TreasureCollectModule {}
