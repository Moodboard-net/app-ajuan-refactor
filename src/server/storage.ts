import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const bucket = process.env.RUSTFS_BUCKET!;

const client = new S3Client({
  endpoint: process.env.RUSTFS_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.RUSTFS_ACCESS_KEY!,
    secretAccessKey: process.env.RUSTFS_SECRET_KEY!,
  },
  forcePathStyle: true,
});

let bucketReady: Promise<void> | null = null;

/** RustFS tidak membuat bucket otomatis; pastikan ada sebelum upload pertama. */
function ensureBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = client
      .send(new HeadBucketCommand({ Bucket: bucket }))
      .catch(() => client.send(new CreateBucketCommand({ Bucket: bucket })))
      .then(() => undefined);
  }
  return bucketReady;
}

export async function uploadFile(
  folder: "bukti-transfer" | "lpj",
  file: File
): Promise<{ objectKey: string; namaFile: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return uploadBuffer(folder, buffer, file.name, file.type);
}

/** Dipakai oleh migrasi data lama, di luar konteks upload form (`File`). */
export async function uploadBuffer(
  folder: "bukti-transfer" | "lpj",
  buffer: Buffer,
  namaFile: string,
  contentType?: string
): Promise<{ objectKey: string; namaFile: string }> {
  await ensureBucket();
  const objectKey = `${folder}/${randomUUID()}-${namaFile}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: contentType || "application/octet-stream",
    })
  );

  return { objectKey, namaFile };
}

export async function getFileUrl(objectKey: string): Promise<string> {
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: objectKey }),
    { expiresIn: 60 * 10 }
  );
}
