import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { auth } from "@/http/middlewares/auth";
import { InviteRepository } from "@/repositories/invite-repository";
import { UserRepository } from "@/repositories/user-repository";
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

				const userRepository = new UserRepository();
				const inviteRepository = new InviteRepository();

				const invite = await inviteRepository.getInviteById(inviteId);

				if (!invite) {
					throw new BadRequestError("Invite not found or expired");
				}

				const user = await userRepository.getUserById(userId);

				if (!user) {
					throw new BadRequestError("User not found");
				}

				if (invite.email !== user.email) {
					throw new BadRequestError("This invite belongs to another user.");
				}

				await inviteRepository.deleteInviteById(inviteId);

				return reply.status(204).send();
			},
		);
}
