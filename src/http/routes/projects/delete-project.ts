import { and } from "drizzle-orm";
import { eq } from "drizzle-orm/sql/expressions/conditions";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { projectSchema } from "@/auth";
import { db, projects } from "@/db/connection";
import { getUserPermissions } from "@/utils/get-user-permissions";
import { auth } from "../../middlewares/auth";
import { BadRequestError } from "../_errors/bad-request-error";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function deleteProject(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.delete(
			"/organizations/:slug/projects/:projectId",
			{
				schema: {
					tags: ["projects"],
					summary: "Delete a project",
					security: [{ bearerAuth: [] }],
					params: z.object({
						slug: z.string(),
						projectId: z.string(),
					}),
					response: {
						204: z.null(),
					},
				},
			},
			async (request, reply) => {
				const { slug, projectId } = request.params;
				const userId = await request.getCurrentUserId();

				const { membership, organization } =
					await request.getUserMembership(slug);

				const project = await db.query.projects.findFirst({
					where(fields) {
						return and(
							eq(fields.id, projectId),
							eq(fields.organizationId, organization.id),
						);
					},
				});

				if (!project) {
					throw new BadRequestError("Project not found");
				}

				const { cannot } = getUserPermissions(userId, membership.role);
				const authProject = projectSchema.parse(organization);

				if (cannot("delete", authProject)) {
					throw new UnauthorizedError(
						`You're not allowed to create this project.`,
					);
				}

				await db.delete(projects).where(eq(projects.id, projectId));

				return reply.status(204).send();
			},
		);
}
