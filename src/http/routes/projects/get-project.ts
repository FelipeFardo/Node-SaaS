import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { ProjectRepository } from "@/repositories/project-repository";
import { getUserPermissions } from "@/utils/get-user-permissions";
import { auth } from "../../middlewares/auth";
import { BadRequestError } from "../_errors/bad-request-error";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function getProject(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			"/organizations/:orgSlug/projects/:projectSlug",
			{
				schema: {
					tags: ["projects"],
					summary: "Get project details",
					security: [{ bearerAuth: [] }],
					params: z.object({
						orgSlug: z.string(),
						projectSlug: z.string(),
					}),
					response: {
						200: z.object({
							project: z.object({
								id: z.uuid(),
								name: z.string(),
								description: z.string(),
								slug: z.string(),
								avatarUrl: z.url().nullable(),
								organizationId: z.uuid(),
								ownerId: z.uuid(),
								owner: z
									.object({
										id: z.uuid(),
										name: z.string().nullable(),
										avatarUrl: z.url().nullable(),
									})
									.nullable(),
							}),
						}),
					},
				},
			},
			async (request, reply) => {
				const { orgSlug, projectSlug } = request.params;
				const userId = await request.getCurrentUserId();

				const { membership, organization } =
					await request.getUserMembership(orgSlug);

				const { cannot } = getUserPermissions(userId, membership.role);

				if (cannot("get", "Project")) {
					throw new UnauthorizedError(
						`You're not allowed to see this projects.`,
					);
				}

				const projectRepository = new ProjectRepository();
				const project = await projectRepository.getProjectByProjectSlug({
					orgId: organization.id,
					projectSlug: projectSlug,
				});

				if (!project) {
					throw new BadRequestError("Project not found");
				}

				return reply.send({ project });
			},
		);
}
