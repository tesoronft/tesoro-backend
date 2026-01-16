import { Module } from '@nestjs/common';
import { ConditionService } from './condition.service';
import { ConditionController } from './condition.controller';
import { Condition, ConditionSchema } from './schema';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';

@Module({
   imports: [
      MongooseModule.forFeature([
        { name: Condition.name, schema: ConditionSchema },
      ]),
      AuthModule,
    ],
  controllers: [ConditionController],
  providers: [ConditionService],
})
export class ConditionModule {}
