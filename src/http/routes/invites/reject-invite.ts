import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { db, invites } from "@/db/connection";
import { auth } from "@/http/middlewares/auth";

import { BadRequestError } from "../_errors/bad-request-error";

export async function rejectInvite(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post(
			"/invites/:inviteId/reject",
			{
				schema: {
					tags: ["invites"],
					summary: "Reject an invite",
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

				await db.delete(invites).where(eq(invites.id, inviteId));

				return reply.status(204).send();
			},
		);
}
