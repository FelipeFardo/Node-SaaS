import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { deleteFromObjectStorage } from "@/lib/cloudflare";
import { OrganizationRepository } from "@/repositories/organization-repository";
import { auth } from "../../middlewares/auth";

export async function updateImageOrganization(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.patch(
			"/organizations/:slug/avatar-url",
			{
				schema: {
					tags: ["organizations"],
					summary: "Update image organization",
					security: [{ bearerAuth: [] }],
					body: z.object({
						imageName: z.string(),
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

				const { organization } = await request.getUserMembership(slug);

				const { imageName } = request.body;

				const organizationRepository = new OrganizationRepository();

				await deleteFromObjectStorage(organization.avatarKey);
				await organizationRepository.updateAvatar({
					avatarKey: imageName,
					orgId: organization.id,
				});

				return reply.status(204).send();
			},
		);
}
