import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { roleSchema } from "@/auth";

import { MemberRepository } from "@/repositories/member-repository";
import { getUserPermissions } from "@/utils/get-user-permissions";
import { auth } from "../../middlewares/auth";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function getMembers(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			"/organizations/:slug/members",
			{
				schema: {
					tags: ["members"],
					summary: "Get all organization members",
					security: [{ bearerAuth: [] }],
					params: z.object({
						slug: z.string(),
					}),
					response: {
						200: z.object({
							members: z.array(
								z.object({
									id: z.string().uuid(),
									userId: z.string(),
									role: roleSchema,
									name: z.string().nullable(),
									email: z.email(),
									avatarKey: z.string().url().nullable(),
								}),
							),
						}),
					},
				},
			},
			async (request, reply) => {
				const { slug } = request.params;
				const userId = await request.getCurrentUserId();

				const { membership, organization } =
					await request.getUserMembership(slug);

				const memberRepository = new MemberRepository();
				const { cannot } = getUserPermissions(userId, membership.role);

				if (cannot("get", "User")) {
					throw new UnauthorizedError(
						`You're not allowed to see organization members.`,
					);
				}

				const membersQuery = await memberRepository.getMembersWithUsersByOrgId(
					organization.id,
				);

				const membersWithRoles = membersQuery.map(({ users, members }) => {
					return {
						userId: users.id,
						...users,
						...members,
					};
				});

				return reply.send({ members: membersWithRoles });
			},
		);
}
