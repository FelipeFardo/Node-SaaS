import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { db } from "@/db/connection";

export async function getOrganizations(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().get(
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
								avatarUrl: z.string().url().nullable(),
							}),
						),
					}),
				},
			},
		},
		async () => {
			const allOrganizations = await db.query.organizations.findMany({
				columns: {
					id: true,
					name: true,
					slug: true,
					avatarUrl: true,
					description: true,
				},
			});

			return {
				organizations: allOrganizations,
			};
		},
	);
}
