import z from "zod";

const envSchema = z.object({
	PORT: z.coerce.number().default(3333),
	DATABASE_URL: z.string().startsWith("postgresql://"),
	JWT_SECRET: z.string(),
	CLOUDFLARE_ACCOUNT_ID: z.string(),
	CLOUDFLARE_ACCESS_KEY_ID: z.string(),
	CLOUDFLARE_SECRET_ACCESS_KEY: z.string(),
	CLOUDFLARE_BUCKET_NAME: z.string(),
	CLOUDFLARE_BUCKET_PUBLIC_URL: z.url(),
});

export const env = envSchema.parse(process.env);
