// import { PutObjectCommand } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import { eq } from "drizzle-orm";
// import type { FastifyInstance } from "fastify";
// import type { ZodTypeProvider } from "fastify-type-provider-zod";
// import { z } from "zod";

// import { db, files } from "@/db/connection";
// import { r2 } from "@/lib/cloudflare";

// import { auth } from "../../middlewares/auth";

// export async function createUpload(app: FastifyInstance) {
// 	app
// 		.withTypeProvider<ZodTypeProvider>()
// 		.register(auth)
// 		.post(
// 			"/upload",
// 			{
// 				schema: {
// 					tags: ["upload"],
// 					summary: "Create a new upload",
// 					security: [{ bearerAuth: [] }],
// 					body: z.object({
// 						name: z.string().min(1),
// 						contentType: z.string().regex(/\w+\/[-+.\w]+/),
// 					}),
// 					response: {
// 						201: z.object({
// 							signedUrl: z.string(),
// 							imageUrl: z.string(),
// 						}),
// 					},
// 				},
// 			},
// 			async (request, reply) => {
// 				const { contentType, name } = request.body;

// 				const bucketName = "siricascudo-dev";

// 				let fileKey = name;
// 				const baseUrl = `https://pub-9448e6c9570e405b8072625bd2387965.r2.dev/`;

// 				let imageUrl = `https://pub-9448e6c9570e405b8072625bd2387965.r2.dev/`;
// 				await db.transaction(async (trx) => {
// 					const [file] = await trx
// 						.insert(files)
// 						.values({
// 							name,
// 							contentType,
// 						})
// 						.returning();

// 					fileKey = file.id.concat("-").concat(name);

// 					imageUrl = baseUrl.concat(fileKey);
// 					await db
// 						.update(files)
// 						.set({
// 							key: fileKey,
// 							url: imageUrl,
// 						})
// 						.where(eq(files.id, file.id));
// 				});

// 				const signedUrl = await getSignedUrl(
// 					r2,
// 					new PutObjectCommand({
// 						Bucket: bucketName,
// 						Key: fileKey,
// 						ContentType: contentType,
// 					}),
// 					{ expiresIn: 600 },
// 				);

// 				return reply.status(201).send({ signedUrl, imageUrl });
// 			},
// 		);
// }
