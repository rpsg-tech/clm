
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'crypto';

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly s3Client: S3Client;
    private readonly bucketName: string;
    private readonly region: string;

    constructor(private configService: ConfigService) {
        this.region = this.configService.get('AWS_REGION', 'us-east-1');
        this.bucketName = this.configService.get('S3_BUCKET_NAME') || this.configService.get('AWS_S3_BUCKET') || '';

        const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');

        if (!accessKeyId || !secretAccessKey || !this.bucketName) {
            this.logger.warn('⚠️ AWS S3 credentials missing. Storage features will fail.');
        }

        this.s3Client = new S3Client({
            region: this.region,
            credentials: {
                accessKeyId: accessKeyId || '',
                secretAccessKey: secretAccessKey || '',
            },
        });
    }

    /**
     * Generate a Presigned URL for uploading a file (PUT)
     * Client uploads directly to S3
     */
    async getUploadUrl(
        folder: string,
        filename: string,
        contentType: string,
        expiresIn = 3600
    ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
        try {
            // Sanitize and unique filename
            const uniqueId = randomBytes(5).toString('hex'); // 10 chars
            const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
            const key = `${folder}/${uniqueId}-${sanitizedName}`;

            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                ContentType: contentType,
            });

            const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

            // Construct public URL (assuming public read or needing getSignedUrl for read)
            // Ideally, we start with private and use getDownloadUrl for reading
            const publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

            return { uploadUrl, key, publicUrl };
        } catch (error) {
            this.logger.error(`Failed to generate upload URL: ${(error as Error).message}`);
            throw new InternalServerErrorException('Storage service unavailable');
        }
    }

    /**
     * Generate Presigned URL for reading a file (GET)
     * Used for private buckets
     */
    async getDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            return await getSignedUrl(this.s3Client, command, { expiresIn });
        } catch (error) {
            this.logger.error(`Failed to generate download URL: ${(error as Error).message}`);
            throw new InternalServerErrorException('Could not access file');
        }
    }

    /**
     * Get file content as Buffer (for internal processing like OCR)
     */
    async getFile(key: string): Promise<Buffer> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            const { Body } = await this.s3Client.send(command);

            if (!Body) {
                throw new Error('Empty body');
            }

            // Convert stream to buffer
            const byteArray = await Body.transformToByteArray();
            return Buffer.from(byteArray);
        } catch (error) {
            this.logger.error(`Failed to retrieve file content: ${(error as Error).message}`);
            throw new InternalServerErrorException('Could not retrieve file content');
        }
    }
}
