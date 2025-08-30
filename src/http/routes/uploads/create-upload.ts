import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { db, files } from "@/db/connection";
import { getSignedUrlUpload } from "@/lib/cloudflare";

import { auth } from "../../middlewares/auth";

export async function createUpload(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post(
			"/upload",
			{
				schema: {
					tags: ["upload"],
					summary: "Create a new upload",
					security: [{ bearerAuth: [] }],
					body: z.object({
						name: z.string().min(1),
						contentType: z.string().regex(/\w+\/[-+.\w]+/),
					}),
					response: {
						201: z.object({
							signedUrl: z.string(),
							fileName: z.string(),
						}),
					},
				},
			},
			async (request, reply) => {
				const { contentType, name } = request.body;

				const fileKey = name;

				const { signedUrl, fileName, fileUrl } = await getSignedUrlUpload({
					fileName: fileKey,
					fileType: contentType,
				});

				await db
					.insert(files)
					.values({
						name: name,
						contentType,
						url: fileUrl,
						key: fileName,
					})
					.returning();

				return reply.status(201).send({ signedUrl, fileName });
			},
		);
}
