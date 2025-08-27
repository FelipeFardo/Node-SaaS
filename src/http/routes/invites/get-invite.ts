import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { roleSchema } from "@/auth";

import { InviteRepository } from "@/repositories/invite-repository";
import { BadRequestError } from "../_errors/bad-request-error";

export async function getInvite(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()

		.get(
			"/invites/:inviteId",
			{
				schema: {
					tags: ["invites"],
					summary: "Get an invite",
					params: z.object({
						inviteId: z.uuid(),
					}),
					response: {
						200: z.object({
							invite: z.object({
								id: z.uuid(),
								email: z.email(),
								role: roleSchema,
								createdAt: z.date(),
								organization: z
									.object({
										name: z.string(),
									})
									.nullable(),
								author: z
									.object({
										id: z.string().uuid(),
										name: z.string().nullable(),
										avatarUrl: z.string().url().nullable(),
									})
									.nullable(),
							}),
						}),
					},
				},
			},
			async (request) => {
				const { inviteId } = request.params;

				const inviteRepository = new InviteRepository();

				const invite =
					await inviteRepository.getInviteWithAuthorAndOrganizationById(
						inviteId,
					);

				if (!invite) {
					throw new BadRequestError("Invite not found");
				}

				const invitFormat = {
					author: invite.author,
					organization: invite.organization,
					...invite.invite,
				};

				return {
					invite: invitFormat,
				};
			},
		);
}
