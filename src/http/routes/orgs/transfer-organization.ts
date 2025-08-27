import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { organizationSchema } from "@/auth";

import { db, members, organizations } from "@/db/connection";
import { getUserPermissions } from "@/utils/get-user-permissions";

import { auth } from "../../middlewares/auth";
import { BadRequestError } from "../_errors/bad-request-error";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function transferOrganization(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.patch(
			"/organizations/:slug/owner",
			{
				schema: {
					tags: ["organizations"],
					summary: "Transfer organization ownership",
					security: [{ bearerAuth: [] }],
					body: z.object({
						transferToUserId: z.string().uuid(),
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
				const { slug } = await request.params;

				const userId = await request.getCurrentUserId();

				const { membership, organization } =
					await request.getUserMembership(slug);

				const authOrganization = organizationSchema.parse(organization);

				const { cannot } = getUserPermissions(userId, membership.role);

				if (cannot("transfer_ownership", authOrganization)) {
					throw new UnauthorizedError(
						`You're not allowed to transfer this organization ownership.`,
					);
				}
				const { transferToUserId } = request.body;

				const transferToMembership = await db.query.members.findFirst({
					where(fields) {
						return and(
							eq(fields.organizationId, organization.id),
							eq(fields.userId, transferToUserId),
						);
					},
				});

				if (!transferToMembership) {
					throw new BadRequestError(
						`Target user is a not a member of this organization`,
					);
				}

				await db.transaction(async (trx) => {
					await trx
						.update(members)
						.set({
							role: "ADMIN",
						})
						.where(
							and(
								eq(members.organizationId, organization.id),
								eq(members.userId, transferToUserId),
							),
						);

					await trx
						.update(organizations)
						.set({
							ownerId: transferToUserId,
						})
						.where(eq(organizations.id, organization.id));
				});

				return reply.status(204).send();
			},
		);
}
