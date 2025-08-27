import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { db, projects, users } from "@/db/connection";
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

				const [project] = await db
					.select({
						id: projects.id,
						name: projects.name,
						description: projects.description,
						slug: projects.slug,
						ownerId: projects.ownerId,
						avatarUrl: projects.avatarUrl,
						organizationId: projects.organizationId,
						owner: {
							id: users.id,
							name: users.name,
							avatarUrl: users.avatarUrl,
						},
					})
					.from(projects)
					.leftJoin(users, eq(projects.ownerId, users.id))
					.where(
						and(
							eq(projects.slug, projectSlug),
							eq(projects.organizationId, organization.id),
						),
					)
					.limit(1);

				if (!project) {
					throw new BadRequestError("Project not found");
				}

				return reply.send({ project });
			},
		);
}
