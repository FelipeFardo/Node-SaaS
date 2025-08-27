import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { userSchema } from "@/auth";

import { db, members, organizations } from "@/db/connection";
import { getUserPermissions } from "@/utils/get-user-permissions";

import { auth } from "../../middlewares/auth";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function removeMember(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.delete(
			"/organizations/:slug/members/:memberId",
			{
				schema: {
					tags: ["members"],
					summary: "Remove a member from the organization",
					security: [{ bearerAuth: [] }],
					params: z.object({
						slug: z.string(),
						memberId: z.string(),
					}),
					response: {
						204: z.null(),
					},
				},
			},
			async (request, reply) => {
				const { slug, memberId } = request.params;
				const userId = await request.getCurrentUserId();

				const { membership, organization } =
					await request.getUserMembership(slug);

				const { cannot } = getUserPermissions(userId, membership.role);

				const [{ members: memberRemove }] = await db
					.select()
					.from(members)
					.innerJoin(
						organizations,
						eq(members.organizationId, organizations.id),
					)
					.where(
						and(
							eq(members.id, memberId),
							eq(members.organizationId, organization.id),
						),
					);

				if (!memberRemove) {
					throw new UnauthorizedError(
						`You're not allowed to remove this member from the organization`,
					);
				}

				const userRemoveFormat = {
					id: memberRemove.id,
					role: memberRemove.role,
					owner: memberRemove.id === organization.ownerId,
				};

				const userRemove = userSchema.parse(userRemoveFormat);

				if (cannot("delete", userRemove)) {
					throw new UnauthorizedError(
						`You're not allowed to remove this member from the organization`,
					);
				}

				await db
					.delete(members)
					.where(
						and(
							eq(members.id, memberId),
							eq(members.organizationId, organization.id),
						),
					);

				return reply.status(204).send();
			},
		);
}
