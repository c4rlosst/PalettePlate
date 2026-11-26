import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
let cached: { client: S3Client; bucket: string } | undefined;
function storage() {
  if (cached) return cached;
  const {
    STORAGE_ENDPOINT: endpoint,
    STORAGE_REGION: region,
    STORAGE_BUCKET: bucket,
    STORAGE_ACCESS_KEY_ID: accessKeyId,
    STORAGE_SECRET_ACCESS_KEY: secretAccessKey,
  } = process.env;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey)
    throw new Error("Photo storage is not configured yet.");
  cached = {
    bucket,
    client: new S3Client({
      endpoint,
      region: region || "auto",
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    }),
  };
  return cached;
}
export async function putImage(key: string, body: Uint8Array, contentType: string) {
  const { client, bucket } = storage();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "private, max-age=31536000",
    }),
  );
}
export async function getImage(key: string) {
  const { client, bucket } = storage();
  const result = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  if (!result.Body) throw new Error("Image not found.");
  return {
    stream: result.Body.transformToWebStream(),
    contentType: result.ContentType || "application/octet-stream",
    length: result.ContentLength,
  };
}
export async function deleteImage(key: string) {
  const { client, bucket } = storage();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
