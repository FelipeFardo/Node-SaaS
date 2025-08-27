import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { MemberRepository } from "@/repositories/member-repository";
import { ProjectRepository } from "@/repositories/project-repository";
import { getUserPermissions } from "@/utils/get-user-permissions";
import { auth } from "../../middlewares/auth";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function getOrganizationBilling(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			"/organizations/:slug/billing",
			{
				schema: {
					tags: ["billing"],
					summary: "Get billing information from organization",
					security: [{ bearerAuth: [] }],
					params: z.object({
						slug: z.string(),
					}),
					response: {
						200: z.object({
							billing: z.object({
								seats: z.object({
									amount: z.number(),
									unit: z.number(),
									price: z.number(),
								}),
								projects: z.object({
									amount: z.number(),
									unit: z.number(),
									price: z.number(),
								}),
								total: z.number(),
							}),
						}),
					},
				},
			},
			async (request) => {
				const { slug } = request.params;

				const userId = await request.getCurrentUserId();
				const { organization, membership } =
					await request.getUserMembership(slug);

				const { cannot } = getUserPermissions(userId, membership.role);

				if (cannot("get", "Billing")) {
					throw new UnauthorizedError(
						`You're not allowed to get billing details from this organization.`,
					);
				}

				const memberRepository = new MemberRepository();
				const projectRepository = new ProjectRepository();

				const [amountOfMembers, amontOfProjects] = await Promise.all([
					memberRepository.countMembersNoBillingRoleByOrgId(organization.id),
					projectRepository.countProjectsByOrgId(organization.id),
				]);

				return {
					billing: {
						seats: {
							amount: amountOfMembers,
							unit: 10,
							price: amountOfMembers * 10,
						},
						projects: {
							amount: amontOfProjects,
							unit: 20,
							price: amontOfProjects * 20,
						},
						total: amountOfMembers * 10 + amontOfProjects * 20,
					},
				};
			},
		);
}
