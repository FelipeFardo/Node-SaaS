import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { roleSchema } from "@/auth";

import { auth } from "@/http/middlewares/auth";
import { InviteRepository } from "@/repositories/invite-repository";
import { UserRepository } from "@/repositories/user-repository";
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

				const userRepository = new UserRepository();
				const inviteRepository = new InviteRepository();
				const user = await userRepository.getUserById(userId);

				if (!user) {
					throw new BadRequestError("User not found");
				}

				const invitesQuery =
					await inviteRepository.getInvitessWithAuthorAndOrganizationByUserEmail(
						user.email,
					);

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
