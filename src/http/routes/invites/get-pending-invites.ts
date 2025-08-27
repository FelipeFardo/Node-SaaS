import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { roleSchema } from "@/auth";

import { db, invites, organizations, users } from "@/db/connection";
import { auth } from "@/http/middlewares/auth";

import { BadRequestError } from "../_errors/bad-request-error";

export async function getPendingInvites(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			"/pending-invites",
			{
				schema: {
					tags: ["invites"],
					summary: "Get all user pending invites",
					security: [{ bearerAuth: [] }],
					response: {
						200: z.object({
							invites: z.array(
								z.object({
									id: z.string().uuid(),
									email: z.email(),
									role: roleSchema,
									createdAt: z.date(),
									organization: z.object({
										name: z.string(),
									}),
									author: z
										.object({
											id: z.string().uuid(),
											name: z.string().nullable(),
											avatarUrl: z.string().url().nullable(),
										})
										.nullable(),
								}),
							),
						}),
					},
				},
			},
			async (request) => {
				const userId = await request.getCurrentUserId();

				const user = await db.query.users.findFirst({
					where(fields) {
						return eq(fields.id, userId);
					},
				});
				if (!user) {
					throw new BadRequestError("User not found");
				}

				const invitesQuery = await db
					.select({
						invites: {
							id: invites.id,
							email: invites.email,
							role: invites.role,
							createdAt: invites.createdAt,
						},
						author: {
							id: users.id,
							name: users.name,
							avatarUrl: users.avatarUrl,
						},
						organization: {
							name: organizations.name,
						},
					})
					.from(invites)
					.innerJoin(users, eq(invites.authorId, users.id))
					.innerJoin(
						organizations,
						eq(invites.organizationId, organizations.id),
					)
					.where(eq(invites.email, user.email));

				const invitesFormat = invitesQuery.map((invite) => {
					return {
						author: invite.author,
						organization: invite.organization,
						...invite.invites,
					};
				});
				return { invites: invitesFormat };
			},
		);
}
