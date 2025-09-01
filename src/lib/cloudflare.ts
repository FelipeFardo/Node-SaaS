import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/env";

export const r2 = new S3Client({
	region: "auto",
	endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: env.CLOUDFLARE_ACCESS_KEY_ID,
		secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY,
	},
});

export interface UploadParams {
	fileName: string;
	fileType: string;
}

export async function getSignedUrlUpload({
	fileName,
	fileType,
}: UploadParams): Promise<{
	signedUrl: string;
	fileName: string;
	fileUrl: string;
}> {
	const uploadId = randomUUID();
	const uniqueFileName = `${uploadId}-${fileName}`;

	const command = new PutObjectCommand({
		Bucket: env.CLOUDFLARE_BUCKET_NAME,
		Key: uniqueFileName,
		ContentType: fileType,
	});

	const signedUrl = await getSignedUrl(r2, command, { expiresIn: 600 });

	return {
		signedUrl: signedUrl,
		fileName: uniqueFileName,
		fileUrl: `${env.CLOUDFLARE_BUCKET_PUBLIC_URL}/${uniqueFileName}`,
	};
}
