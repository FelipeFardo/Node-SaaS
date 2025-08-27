import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { db, invites, members } from "@/db/connection";
import { auth } from "@/http/middlewares/auth";

import { BadRequestError } from "../_errors/bad-request-error";

export async function acceptInvite(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post(
			"/invites/:inviteId/accept",
			{
				schema: {
					tags: ["invites"],
					summary: "Accept an invite",
					params: z.object({
						inviteId: z.string().uuid(),
					}),
					response: {
						204: z.null(),
					},
				},
			},
			async (request, reply) => {
				const userId = await request.getCurrentUserId();
				const { inviteId } = request.params;

				const invite = await db.query.invites.findFirst({
					where(fields) {
						return eq(fields.id, inviteId);
					},
				});

				if (!invite) {
					throw new BadRequestError("Invite not found or expired");
				}

				const user = await db.query.users.findFirst({
					where(fields) {
						return eq(fields.id, userId);
					},
				});

				if (!user) {
					throw new BadRequestError("User not found");
				}

				if (invite.email !== user.email) {
					throw new BadRequestError("This invite belongs to another user.");
				}

				await db.transaction(async (trx) => {
					await trx.insert(members).values({
						userId,
						organizationId: invite.organizationId,
						role: invite.role,
					});

					await trx.delete(invites).where(eq(invites.id, inviteId));
				});

				return reply.status(204).send();
			},
		);
}
