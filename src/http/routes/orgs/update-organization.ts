import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { organizationSchema } from "@/auth";
import { OrganizationRepository } from "@/repositories/organization-repository";
import { getUserPermissions } from "@/utils/get-user-permissions";
import { auth } from "../../middlewares/auth";
import { BadRequestError } from "../_errors/bad-request-error";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function updateOrganization(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.put(
			"/organizations/:slug",
			{
				schema: {
					tags: ["organizations"],
					summary: "Update organization details",
					security: [{ bearerAuth: [] }],
					body: z.object({
						name: z.string(),
						domain: z.string().nullish(),
						shouldAttachUsersByDomain: z.boolean().optional(),
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
				const { slug } = request.params;

				const userId = await request.getCurrentUserId();

				const { name, domain, shouldAttachUsersByDomain } = request.body;

				const { membership, organization } =
					await request.getUserMembership(slug);

				const organizationRepository = new OrganizationRepository();

				const authOrganization = organizationSchema.parse(organization);

				const { cannot } = getUserPermissions(userId, membership.role);

				if (cannot("update", authOrganization)) {
					throw new UnauthorizedError(
						`You're not allowed to update this organization.`,
					);
				}

				if (domain) {
					const organizationByDomain =
						await organizationRepository.getOrganizationByDomainAndOrgId({
							domain,
							orgId: organization.id,
						});

					if (organizationByDomain) {
						throw new BadRequestError(
							"Another organization with same domain already exists.",
						);
					}
				}

				await organizationRepository.updateOrganization({
					name,
					domain,
					shouldAttachUsersByDomain,
					orgId: organization.id,
				});

				return reply.status(204).send();
			},
		);
}
