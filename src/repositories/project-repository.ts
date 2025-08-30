import { and, count, desc, eq } from "drizzle-orm";
import { db, projects, users } from "@/db/connection";

export class ProjectRepository {
	async insertProject({
		description,
		name,
		orgId,
		ownerId,
		slug,
	}: {
		name: string;
		slug: string;
		description: string;
		orgId: string;
		ownerId: string;
	}) {
		const [project] = await db
			.insert(projects)
			.values({
				name,
				slug,
				description,
				organizationId: orgId,
				ownerId: ownerId,
			})
			.returning();
		return project;
	}

	async deleteProject(id: string) {
		await db.delete(projects).where(eq(projects.id, id));
	}

	async getProjectByProjectSlug({
		orgId,
		projectSlug,
	}: {
		orgId: string;
		projectSlug: string;
	}) {
		const [project] = await db
			.select({
				id: projects.id,
				name: projects.name,
				description: projects.description,
				slug: projects.slug,
				ownerId: projects.ownerId,
				avatarKey: projects.avatarKey,
				organizationId: projects.organizationId,
				owner: {
					id: users.id,
					name: users.name,
					avatarKey: users.avatarKey,
				},
			})
			.from(projects)
			.leftJoin(users, eq(projects.ownerId, users.id))
			.where(
				and(eq(projects.slug, projectSlug), eq(projects.organizationId, orgId)),
			)
			.limit(1);

		return project;
	}

	async getProjectByOrgId(orgId: string) {
		const drizzleProjects = await db
			.select({
				id: projects.id,
				name: projects.name,
				description: projects.description,
				slug: projects.slug,
				ownerId: projects.ownerId,
				avatarKey: projects.avatarKey,
				organizationId: projects.organizationId,
				createdAt: projects.createdAt,
				owner_id: users.id,
				owner_name: users.name,
				owner_avatarKey: users.avatarKey,
			})
			.from(projects)
			.leftJoin(users, eq(projects.ownerId, users.id))
			.where(eq(projects.organizationId, orgId))
			.orderBy(desc(projects.createdAt));

		return drizzleProjects;
	}

	async updateProject({
		name,
		description,
		projectId,
	}: {
		name: string;
		description: string;
		projectId: string;
	}) {
		await db
			.update(projects)
			.set({
				name,
				description,
			})
			.where(eq(projects.id, projectId));
	}

	async countProjectsByOrgId(orgId: string) {
		const projectCount = db
			.select({ count: count() })
			.from(projects)
			.where(eq(projects.organizationId, orgId))
			.then((result) => result[0].count);

		return projectCount;
	}
}
