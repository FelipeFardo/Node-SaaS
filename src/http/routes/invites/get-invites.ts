import { asc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { roleSchema } from "@/auth";

import { db, invites, organizations, users } from "@/db/connection";
import { getUserPermissions } from "@/utils/get-user-permissions";

import { auth } from "../../middlewares/auth";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function getInvites(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			"/organizations/:slug/invites",
			{
				schema: {
					tags: ["invites"],
					summary: "Get all organization invites",
					security: [{ bearerAuth: [] }],
					params: z.object({
						slug: z.string(),
					}),
					response: {
						200: z.object({
							invites: z.array(
								z.object({
									id: z.string().uuid(),
									email: z.email(),
									role: roleSchema,
									createdAt: z.date(),
									author: z
										.object({
											id: z.string().uuid(),
											name: z.string().nullable(),
										})
										.nullable(),
								}),
							),
						}),
					},
				},
			},
			async (request) => {
				const { slug } = request.params;
				const userId = await request.getCurrentUserId();

				const { membership, organization } =
					await request.getUserMembership(slug);

				const { cannot } = getUserPermissions(userId, membership.role);

				if (cannot("get", "Invite")) {
					throw new UnauthorizedError(
						`You're not allowed to get organization invites.`,
					);
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
						},
					})
					.from(invites)
					.innerJoin(users, eq(invites.authorId, users.id))
					.innerJoin(
						organizations,
						eq(invites.organizationId, organizations.id),
					)
					.where(eq(organizations.slug, organization.slug))
					.orderBy(asc(invites.createdAt));

				const invitesFormat = invitesQuery.map((invite) => {
					return {
						author: invite.author,
						...invite.invites,
					};
				});
				return {
					invites: invitesFormat,
				};
			},
		);
}
