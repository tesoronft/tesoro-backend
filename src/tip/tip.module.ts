import { Module } from '@nestjs/common';
import { TipService } from './tip.service';
import { TipController } from './tip.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Tip, TipSchema } from './schema';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tip.name, schema: TipSchema }]),
    AuthModule,
  ],
  controllers: [TipController],
  providers: [TipService],
})
export class TipModule {}
