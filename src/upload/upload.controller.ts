import { All, Controller, Get, NotFoundException, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { TusService } from './tus.service';

@Controller('upload/files')
export class UploadController {
  constructor(private readonly tusService: TusService) {}

  @All()
  tusBase(@Req() req: Request, @Res() res: Response) {
    return this.tusService.handleTus(req, res);
  }


  @Get(':id')
  getFile(@Param('id') id: string, @Res() res: Response) {
    return this.tusService.serveFile(id, res);
  }

  @All('*path')
  tusPath(@Req() req: Request, @Res() res: Response) {
    return this.tusService.handleTus(req, res);
  }
}
