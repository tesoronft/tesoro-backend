import { Module } from '@nestjs/common';
import { TreasureService } from './treasure.service';
import { TreasureController } from './treasure.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Treasure, TreasureSchema, Report, ReportSchema } from './schema';
import { User, UserSchema } from 'src/user/schema';
import { AuthModule } from 'src/auth/auth.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Treasure.name, schema: TreasureSchema },
      { name: Report.name, schema: ReportSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    EmailModule,
  ],
  controllers: [TreasureController],
  providers: [TreasureService],
})
export class TreasureModule {}
