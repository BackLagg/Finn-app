import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PartnerRoom, PartnerRoomSchema } from '../../schemas/partner-room.schema';
import { PartnerRoomService } from './partner-room.service';
import { PartnerRoomController } from './partner-room.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PartnerRoom.name, schema: PartnerRoomSchema },
    ]),
  ],
  controllers: [PartnerRoomController],
  providers: [PartnerRoomService],
  exports: [PartnerRoomService],
})
export class PartnerRoomModule {}
