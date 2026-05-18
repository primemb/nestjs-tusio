import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { TusService } from './tus.service';

@Module({
  controllers: [UploadController],
  providers: [TusService],
})
export class UploadModule {}
