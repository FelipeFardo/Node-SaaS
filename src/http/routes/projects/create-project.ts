import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { ProjectRepository } from "@/repositories/project-repository";
import { createSlug } from "@/utils/create-slug";
import { getUserPermissions } from "@/utils/get-user-permissions";
import { auth } from "../../middlewares/auth";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function createProject(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post(
			"/organizations/:slug/projects",
			{
				schema: {
					tags: ["projects"],
					summary: "Create a new project",
					security: [{ bearerAuth: [] }],
					body: z.object({
						name: z.string(),
						description: z.string(),
					}),
					params: z.object({
						slug: z.string(),
					}),
					response: {
						201: z.object({
							projectId: z.string().uuid(),
						}),
					},
				},
			},
			async (request, reply) => {
				const { slug } = request.params;

				const { description, name } = request.body;
				const userId = await request.getCurrentUserId();

				const { membership, organization } =
					await request.getUserMembership(slug);

				const { cannot } = getUserPermissions(userId, membership.role);

				if (cannot("create", "Project")) {
					throw new UnauthorizedError(
						`You're not allowed to create new projects.`,
					);
				}

				const projectRepository = new ProjectRepository();

				const projectSlug = createSlug(name);

				const project = await projectRepository.insertProject({
					description,
					name,
					orgId: organization.id,
					ownerId: userId,
					slug: projectSlug,
				});

				return reply.status(201).send({
					projectId: project.id,
				});
			},
		);
}
