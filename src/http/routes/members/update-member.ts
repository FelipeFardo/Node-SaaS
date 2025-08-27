import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { roleSchema } from "@/auth";

import { db, members } from "@/db/connection";
import { getUserPermissions } from "@/utils/get-user-permissions";

import { auth } from "../../middlewares/auth";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function updateMember(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.put(
			"/organizations/:slug/members/:memberId",
			{
				schema: {
					tags: ["members"],
					summary: "Update a member",
					security: [{ bearerAuth: [] }],
					params: z.object({
						slug: z.string(),
						memberId: z.string(),
					}),
					body: z.object({
						role: roleSchema,
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

				if (cannot("update", "User")) {
					throw new UnauthorizedError(
						`You're not allowed to update this member`,
					);
				}

				const { role } = request.body;

				await db
					.update(members)
					.set({
						role,
					})
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
