import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";

const REQUIRED_ENV_VARS = ["AWS_S3_BUCKET", "AWS_REGION"];

function assertEnv() {
    for (const key of REQUIRED_ENV_VARS) {
        if (!process.env[key]) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
    }
}

assertEnv();

const S3_BUCKET = process.env.AWS_S3_BUCKET as string;
const S3_REGION = process.env.AWS_REGION as string;
const S3_BASE_URL =
    process.env.AWS_S3_PUBLIC_URL ||
    `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

const s3 = new S3Client({
    region: S3_REGION,
    credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
            ? {
                  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
              }
            : undefined,
});

export interface UploadParams {
    buffer: Buffer;
    mimeType: string;
    originalName?: string;
    folder: string;
    acl?: "private" | "public-read";
}

export interface UploadResult {
    key: string;
    url: string;
}

function buildObjectKey(folder: string, originalName?: string) {
    const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
    const ext = originalName ? path.extname(originalName) : "";
    return `${cleanFolder}/${Date.now()}-${randomUUID()}${ext}`.replace("//", "/");
}

export async function uploadToS3({
    buffer,
    mimeType,
    originalName,
    folder,
    acl = "public-read",
}: UploadParams): Promise<UploadResult> {
    const key = buildObjectKey(folder, originalName);

    await s3.send(
        new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
            ACL: acl,
        })
    );

    return {
        key,
        url: `${S3_BASE_URL}/${key}`,
    };
}

export async function deleteFromS3(key?: string | null) {
    if (!key) return;

    try {
        await s3.send(
            new DeleteObjectCommand({
                Bucket: S3_BUCKET,
                Key: key,
            })
        );
    } catch (error) {
        console.error("[S3] Failed to delete object:", key, error);
    }
}

