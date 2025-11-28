import { Module } from '@nestjs/common';
import { TreasureService } from './treasure.service';
import { TreasureController } from './treasure.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Treasure, TreasureSchema } from './schema';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Treasure.name, schema: TreasureSchema },
    ]),
    AuthModule,
  ],
  controllers: [TreasureController],
  providers: [TreasureService],
})
export class TreasureModule {}
