import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { organizationSchema } from "@/auth";
import { MemberRepository } from "@/repositories/member-repository";
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

				const memberRepository = new MemberRepository();

				const transferToMembership =
					await memberRepository.getMemberByOrgIdAndUserId({
						orgId: organization.id,
						userId: transferToUserId,
					});

				if (!transferToMembership) {
					throw new BadRequestError(
						`Target user is a not a member of this organization`,
					);
				}

				await memberRepository.transferOrganizationOwnership({
					orgId: organization.id,
					transferToUserId,
				});

				return reply.status(204).send();
			},
		);
}
