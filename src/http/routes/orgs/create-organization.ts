import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { OrganizationRepository } from "@/repositories/organization-repository";
import { auth } from "../../middlewares/auth";
import { BadRequestError } from "../_errors/bad-request-error";

export async function createOrganization(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post(
			"/organizations",
			{
				schema: {
					tags: ["organizations"],
					summary: "Create a new organization",
					security: [{ bearerAuth: [] }],
					body: z.object({
						name: z.string(),
						domain: z.string().nullish(),
						shouldAttachUsersByDomain: z.boolean().optional(),
					}),
					response: {
						201: z.object({
							organizationId: z.string().uuid(),
						}),
					},
				},
			},
			async (request, reply) => {
				const userId = await request.getCurrentUserId();
				const { name, domain, shouldAttachUsersByDomain } = request.body;

				const organizationRepository = new OrganizationRepository();

				if (domain) {
					const organizationByDomain =
						await organizationRepository.getOrganizationByDomain(domain);

					if (organizationByDomain) {
						throw new BadRequestError(
							"Another organization with same domain already exists.",
						);
					}
				}

				const organizationId = "";

				await organizationRepository.insertOrganization({
					name,
					shouldAttachUsersByDomain,
					domain,
					ownerId: userId,
				});

				return reply.status(201).send({
					organizationId,
				});
			},
		);
}
