import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Request, Response } from 'express';
import { Server, EVENTS } from '@tus/server';
import { v4 as uuid } from 'uuid';
import { FileStore } from '@tus/file-store';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import { FileMetadata } from './models/file-metadata.model';

@Injectable()
export class TusService implements OnModuleInit {
  private readonly logger = new Logger(TusService.name);
  private readonly tusServer: Server;

  constructor() {
    this.tusServer = new Server({
      path: '/upload/files',
      datastore: new FileStore({
        directory: path.join(process.cwd(), 'uploads'),
      }),
      namingFunction: (req) => {
        try {
          const metadata = this.getFileMetadata(req);

          const prefix: string = uuid();

          const fileName = metadata.extension
            ? prefix + '.' + metadata.extension
            : prefix;

          this.logger.debug(
            `Generated filename: ${fileName} for upload with metadata: ${JSON.stringify(metadata)}`,
          );

          return fileName;
        } catch (e) {
          this.logger.error(e);

          // rethrow error
          throw e;
        }
      },
    });
  }

  private getFileMetadata(req: any): FileMetadata {
    const uploadMeta: string = req.headers.get('upload-metadata');

    const metadata = new FileMetadata();

    uploadMeta.split(',').forEach((item) => {
      const [key, value] = item.trim().split(' ');

      metadata[key] = Buffer.from(value, 'base64').toString('utf8');
    });

    const extension = metadata.filename?.split('.').pop();

    if (!extension) {
      this.logger.warn(
        `Could not determine file extension for upload with metadata: ${JSON.stringify(metadata)}`,
      );

      throw new Error('Invalid file metadata: missing or invalid filename');
    }

    metadata.extension = extension;

    return metadata;
  }

  onModuleInit() {
    this.tusServer.on(EVENTS.POST_CREATE, (req, upload) => {
      this.logger.log(`Upload created: ${upload.id}`);
    });

    this.tusServer.on(EVENTS.POST_FINISH, async (req, res, upload) => {
      this.logger.log(
        `Upload finished: ${upload.id} — ${JSON.stringify(upload.metadata)}`,
      );
    });
  }

  async serveFile(fileId: string, res: Response): Promise<void> {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, fileId);

    let filename = fileId;
    let contentType = 'application/octet-stream';

    try {
      const raw = await fs.readFile(path.join(uploadsDir, `${fileId}.json`), 'utf8');
      const info = JSON.parse(raw);
      if (info.metadata?.filename) filename = info.metadata.filename;
      if (info.metadata?.filetype) contentType = info.metadata.filetype;
    } catch {
      // no sidecar, fall back to defaults
    }

    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException('File not found');
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );

    createReadStream(filePath).pipe(res);
  }

  handleTus(req: Request, res: Response) {
    return this.tusServer.handle(req, res);
  }
}
