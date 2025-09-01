import { and, eq, ne } from "drizzle-orm";
import { db, files, members, organizations } from "@/db/connection";

export class OrganizationRepository {
	async getOrganizationById(id: string) {
		const organization = await db.query.organizations.findFirst({
			where(fields) {
				return eq(fields.slug, id);
			},
		});
		return organization;
	}

	async getOrganizationBySlug(slug: string) {
		const organization = await db.query.organizations.findFirst({
			where(fields) {
				return eq(fields.slug, slug);
			},
		});

		return organization;
	}

	async getOrganizationByDomain(domain: string) {
		const autoJoinOrganization = await db.query.organizations.findFirst({
			where(fields) {
				return and(
					eq(fields.domain, domain),
					eq(fields.shouldAttachUsersByDomain, true),
				);
			},
		});

		return autoJoinOrganization;
	}

	async getOrganizationByDomainAndOrgId({
		domain,
		orgId,
	}: {
		domain: string;
		orgId: string;
	}) {
		const organization = await db.query.organizations.findFirst({
			where(fields) {
				return and(eq(fields.domain, domain), ne(fields.id, orgId));
			},
		});

		return organization;
	}

	async insertOrganization({
		domain,
		name,
		slug,
		shouldAttachUsersByDomain,
		ownerId,
	}: {
		name: string;
		domain: string | null | undefined;
		slug: string;
		shouldAttachUsersByDomain: boolean | undefined;
		ownerId: string;
	}) {
		let organizationId = "";

		await db.transaction(async (trx) => {
			const [organization] = await trx
				.insert(organizations)
				.values({
					name,
					slug,
					domain,
					shouldAttachUsersByDomain,
					ownerId: ownerId,
				})
				.returning();

			organizationId = organization.id;

			await trx.insert(members).values({
				organizationId: organization.id,
				userId: ownerId,
				role: "ADMIN",
			});
		});
		return organizationId;
	}

	async getOrganizationsByUserId(userId: string) {
		const orgs = await db
			.select({
				id: organizations.id,
				name: organizations.name,
				slug: organizations.slug,
				avatarKey: organizations.avatarKey,
				role: members.role,
			})
			.from(organizations)
			.innerJoin(members, eq(members.organizationId, organizations.id))
			.where(eq(members.userId, userId));

		return orgs;
	}

	async deleteOrganization(id: string) {
		await db.delete(organizations).where(eq(organizations.id, id));
	}

	async updateAvatar({
		avatarKey,
		orgId,
	}: {
		avatarKey: string;
		orgId: string;
	}) {
		await db.transaction(async (db) => {
			await db
				.update(organizations)
				.set({
					avatarKey: avatarKey,
				})
				.where(eq(organizations.id, orgId));

			db.delete(files).where(eq(files.key, avatarKey));
		});
	}

	async updateOrganization({
		domain,
		name,
		shouldAttachUsersByDomain,
		orgId,
	}: {
		name: string;
		domain: string | null | undefined;
		shouldAttachUsersByDomain: boolean | undefined;
		orgId: string;
	}) {
		await db
			.update(organizations)
			.set({
				name,
				domain,
				shouldAttachUsersByDomain,
			})
			.where(eq(organizations.id, orgId));
	}
}
