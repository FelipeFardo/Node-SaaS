import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "@/db/connection";
import { BadRequestError } from "../_errors/bad-request-error";

export async function getOrganization(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		// .register(auth)
		.get(
			"/organizations/:slug",
			{
				schema: {
					tags: ["organizations"],
					summary: "Get details from organization",
					//   security: [{ bearerAuth: [] }],
					params: z.object({
						slug: z.string(),
					}),
					response: {
						200: z.object({
							organization: z.object({
								id: z.string().uuid(),
								name: z.string(),
								slug: z.string(),
								description: z.string().nullable(),
								domain: z.string().nullable(),
								shouldAttachUsersByDomain: z.boolean(),
								avatarUrl: z.string().url().nullable(),
								createdAt: z.date(),
								updatedAt: z.date(),
								ownerId: z.string().uuid(),
							}),
						}),
					},
				},
			},
			async (request) => {
				const { slug } = request.params;

				const organization = await db.query.organizations.findFirst({
					where(fields) {
						return eq(fields.slug, slug);
					},
				});

				if (!organization) {
					throw new BadRequestError("Organization Not Found");
				}

				return {
					organization,
				};
			},
		);
}
