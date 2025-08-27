import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { db, organizations } from "@/db/connection";

import { auth } from "../../middlewares/auth";

export async function updateImageOrganization(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.patch(
			"/organizations/:slug/avatar-url",
			{
				schema: {
					tags: ["organizations"],
					summary: "Update image organization",
					security: [{ bearerAuth: [] }],
					body: z.object({
						imageUrl: z.string(),
					}),
					params: z.object({
						slug: z.string(),
					}),
					response: {
						204: z.null(),
					},
				},
			},
			async (request, reply) => {
				const { slug } = request.params;

				const { organization } = await request.getUserMembership(slug);

				const { imageUrl } = request.body;

				await db
					.update(organizations)
					.set({
						avatarUrl: imageUrl,
					})
					.where(eq(organizations.id, organization.id));

				return reply.status(204).send();
			},
		);
}
