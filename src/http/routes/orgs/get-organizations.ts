import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { auth } from "@/http/middlewares/auth";
import { OrganizationRepository } from "@/repositories/organization-repository";

export async function getOrganizations(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			"/organizations",
			{
				schema: {
					tags: ["organizations"],
					summary: "Get all organizations ",
					response: {
						200: z.object({
							organizations: z.array(
								z.object({
									id: z.string().uuid(),
									name: z.string(),
									slug: z.string(),
									avatarKey: z.string().nullable(),
								}),
							),
						}),
					},
				},
			},
			async (request) => {
				const userId = await request.getCurrentUserId();

				const organizationRepository = new OrganizationRepository();
				const organizations =
					await organizationRepository.getOrganizationsByUserId(userId);

				return {
					organizations,
				};
			},
		);
}
