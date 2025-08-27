import { desc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
// Drizzle ORM equivalent
import { db } from "@/db/connection";
import { projects as projectsTable, users } from "@/db/schema";
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
									avatarUrl: z.string().url().nullable(),
									organizationId: z.uuid(),
									ownerId: z.uuid(),
									createdAt: z.date(),
									owner: z.object({
										id: z.uuid(),
										name: z.string().nullable(),
										avatarUrl: z.string().url().nullable(),
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

				const drizzleProjects = await db
					.select({
						id: projectsTable.id,
						name: projectsTable.name,
						description: projectsTable.description,
						slug: projectsTable.slug,
						ownerId: projectsTable.ownerId,
						avatarUrl: projectsTable.avatarUrl,
						organizationId: projectsTable.organizationId,
						createdAt: projectsTable.createdAt,
						owner_id: users.id,
						owner_name: users.name,
						owner_avatarUrl: users.avatarUrl,
					})
					.from(projectsTable)
					.leftJoin(users, eq(projectsTable.ownerId, users.id))
					.where(eq(projectsTable.organizationId, organization.id))
					.orderBy(desc(projectsTable.createdAt));

				const projects = drizzleProjects.map((project) => ({
					id: project.id,
					name: project.name,
					description: project.description,
					slug: project.slug,
					ownerId: project.ownerId,
					avatarUrl: project.avatarUrl,
					organizationId: project.organizationId,
					createdAt: project.createdAt,
					owner: {
						id: project.owner_id ?? "",
						name: project.owner_name ?? null,
						avatarUrl: project.owner_avatarUrl ?? null,
					},
				}));

				return reply.send({ projects });
			},
		);
}
