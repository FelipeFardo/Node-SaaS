import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { roleSchema } from "@/auth";
import { db, members } from "@/db/connection";
import { auth } from "../../middlewares/auth";

export async function getMemberOrganizations(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			"/organizations/member",
			{
				schema: {
					tags: ["organizations"],
					summary: "Get organization where user is a member",
					security: [{ bearerAuth: [] }],
					response: {
						200: z.object({
							organizations: z.array(
								z.object({
									id: z.string().uuid(),
									name: z.string(),
									slug: z.string(),
									avatarUrl: z.string().url().nullable(),
									role: roleSchema,
								}),
							),
						}),
					},
				},
			},
			async (request) => {
				const userId = await request.getCurrentUserId();

				const organizationsUser = await db.query.members.findMany({
					columns: {
						id: true,
						role: true,
					},
					with: {
						organization: {
							columns: {
								id: true,
								name: true,
								slug: true,
								avatarUrl: true,
							},
						},
					},
					where(_) {
						return eq(members.userId, userId);
					},
				});

				const organizationsWithUserRole = organizationsUser.map(
					({ organization, role }) => ({
						...organization,
						role,
					}),
				);

				return {
					organizations: organizationsWithUserRole,
				};
			},
		);
}
