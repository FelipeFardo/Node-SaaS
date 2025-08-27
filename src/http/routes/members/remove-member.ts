import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { userSchema } from "@/auth";

import { MemberRepository } from "@/repositories/member-repository";
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

				const memberRepository = new MemberRepository();
				const { cannot } = getUserPermissions(userId, membership.role);

				const memberRemove = await memberRepository.getMemberByIdAndOrgId({
					memberId,
					organizationId: organization.id,
				});

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

				await memberRepository.deleteMember({
					memberId: memberRemove.id,
					organizationId: organization.id,
				});

				return reply.status(204).send();
			},
		);
}
