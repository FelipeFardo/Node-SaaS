import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { ProjectRepository } from "@/repositories/project-repository";
// Drizzle ORM equivalent
import { getUserPermissions } from "@/utils/get-user-permissions";
import { auth } from "../../middlewares/auth";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function getProjects(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			"/organizations/:slug/projects",
			{
				schema: {
					tags: ["projects"],
					summary: "Get all organization projects",
					security: [{ bearerAuth: [] }],
					params: z.object({
						slug: z.string(),
					}),
					response: {
						200: z.object({
							projects: z.array(
								z.object({
									id: z.uuid(),
									name: z.string(),
									description: z.string(),
									slug: z.string(),
									avatarKey: z.string().url().nullable(),
									organizationId: z.uuid(),
									ownerId: z.uuid(),
									createdAt: z.date(),
									owner: z.object({
										id: z.uuid(),
										name: z.string().nullable(),
										avatarKey: z.string().url().nullable(),
									}),
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

				const { cannot } = getUserPermissions(userId, membership.role);

				if (cannot("get", "Project")) {
					throw new UnauthorizedError(
						`You're not allowed to see organization projects.`,
					);
				}

				const projectRepository = new ProjectRepository();
				const drizzleProjects = await projectRepository.getProjectByOrgId(
					organization.id,
				);

				const projects = drizzleProjects.map((project) => ({
					id: project.id,
					name: project.name,
					description: project.description,
					slug: project.slug,
					ownerId: project.ownerId,
					avatarKey: project.avatarKey,
					organizationId: project.organizationId,
					createdAt: project.createdAt,
					owner: {
						id: project.owner_id ?? "",
						name: project.owner_name ?? null,
						avatarKey: project.owner_avatarKey ?? null,
					},
				}));

				return reply.send({ projects });
			},
		);
}
