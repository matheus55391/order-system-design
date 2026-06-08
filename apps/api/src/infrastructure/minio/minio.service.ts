import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import * as Minio from "minio";

const BUCKET = "products";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client!: Minio.Client;
  private publicUrl!: string;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const endpoint =
      this.config.get<string>("MINIO_ENDPOINT") ?? "http://localhost:9000";
    const parsed = new URL(endpoint);

    this.publicUrl =
      this.config.get<string>("MINIO_PUBLIC_URL") ?? endpoint;

    this.client = new Minio.Client({
      endPoint: parsed.hostname,
      port: parsed.port
        ? Number(parsed.port)
        : parsed.protocol === "https:"
          ? 443
          : 9000,
      useSSL: parsed.protocol === "https:",
      accessKey:
        this.config.get<string>("MINIO_ROOT_USER") ?? "order_system",
      secretKey:
        this.config.get<string>("MINIO_ROOT_PASSWORD") ?? "order_system",
    });

    try {
      const exists = await this.client.bucketExists(BUCKET);
      if (!exists) {
        await this.client.makeBucket(BUCKET);
        this.logger.log(`Bucket "${BUCKET}" criado no MinIO`);
      }
    } catch (error) {
      this.logger.warn(
        `MinIO indisponível — upload de imagens ficará offline: ${String(error)}`,
      );
    }
  }

  async uploadProductImage(
    buffer: Buffer,
    mimetype: string,
  ): Promise<string> {
    if (!ALLOWED_MIME_TYPES.has(mimetype)) {
      throw new BadRequestException(
        "Formato não suportado. Use JPEG, PNG ou WebP.",
      );
    }

    if (buffer.length > MAX_FILE_SIZE) {
      throw new BadRequestException("Imagem muito grande (máximo 5 MB).");
    }

    const extension =
      mimetype === "image/jpeg"
        ? "jpg"
        : mimetype === "image/png"
          ? "png"
          : "webp";
    const objectName = `${randomUUID()}.${extension}`;

    await this.client.putObject(BUCKET, objectName, buffer, buffer.length, {
      "Content-Type": mimetype,
    });

    return `${this.publicUrl}/${BUCKET}/${objectName}`;
  }
}
