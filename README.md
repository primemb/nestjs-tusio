# nestjs-tus

A NestJS server implementing the **[tus resumable upload protocol](https://tus.io/)**, allowing clients to upload large files reliably with support for pause and resume.

## What it does

- Accepts resumable file uploads via the tus protocol at `POST /upload/files`
- Stores uploaded files on disk under the `uploads/` directory
- Names each file with a UUID prefix and preserves the original file extension (e.g. `a3f1c2d4-....jpg`)
- Serves uploaded files for download at `GET /upload/files/:id`
- Responds with the correct `Content-Type` and `Content-Disposition` headers (original filename is preserved)
- CORS is enabled for all origins

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/upload/files` | Initiate a new tus upload |
| `PATCH` | `/upload/files/:id` | Resume / continue an upload |
| `HEAD` | `/upload/files/:id` | Query upload offset |
| `OPTIONS` | `/upload/files` | tus capability discovery |
| `GET` | `/upload/files/:id` | Download a completed upload |

## Tech stack

- **NestJS 11** — server framework
- **@tus/server** — tus protocol implementation
- **@tus/file-store** — disk-based storage backend
- **uuid** — unique file ID generation

## Project setup

```bash
pnpm install
```

## Run the server

```bash
# development
pnpm run start

# watch mode
pnpm run start:dev

# production
pnpm run start:prod
```

The TUS upload endpoint will be available at:

```
http://localhost:3000/upload/files
```

## Configuration

| Environment variable | Default | Description |
|---------------------|---------|-------------|
| `PORT` | `3000` | Port the server listens on |

Uploaded files are stored in the `uploads/` directory at the project root. Each upload produces two files:

- `<uuid>.<ext>` — the raw file data
- `<uuid>.<ext>.json` — tus metadata sidecar (filename, filetype, size, etc.)

## Run tests

```bash
# unit tests
pnpm run test

# e2e tests
pnpm run test:e2e

# test coverage
pnpm run test:cov
```
