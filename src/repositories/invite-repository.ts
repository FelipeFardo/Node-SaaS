import { and, asc, eq } from "drizzle-orm";
import {
	db,
	invites,
	members,
	organizations,
	type Role,
	users,
} from "@/db/connection";

export class InviteRepository {
	async getInviteById(id: string) {
		const invite = await db.query.invites.findFirst({
			where(fields) {
				return eq(fields.id, id);
			},
		});

		return invite;
	}

	async acceptInvite({
		inviteId,
		organizationId,
		role,
		userId,
	}: {
		userId: string;
		organizationId: string;
		role: Role;
		inviteId: string;
	}) {
		await db.transaction(async (trx) => {
			await trx.insert(members).values({
				userId,
				organizationId: organizationId,
				role: role,
			});

			await trx.delete(invites).where(eq(invites.id, inviteId));
		});
	}

	async getInviteByUserEmailAndOrganizationId({
		organizationId,
		userEmail,
	}: {
		userEmail: string;
		organizationId: string;
	}) {
		const inviteWithSameEmail = await db.query.invites.findFirst({
			where(fields) {
				return and(
					eq(fields.email, userEmail),
					eq(fields.organizationId, organizationId),
				);
			},
		});

		return inviteWithSameEmail;
	}

	async insertInvite({
		email,
		organizationId,
		role,
		userId,
	}: {
		organizationId: string;
		email: string;
		role: Role;
		userId: string;
	}) {
		const [invite] = await db
			.insert(invites)
			.values({
				organizationId: organizationId,
				email,
				role,
				authorId: userId,
			})
			.returning();

		return invite;
	}

	async getInviteWithAuthorAndOrganizationById(inviteId: string) {
		const [invite] = await db
			.select({
				invite: {
					id: invites.id,
					email: invites.email,
					role: invites.role,
					createdAt: invites.createdAt,
				},
				author: {
					id: users.id,
					name: users.name,
					avatarKey: users.avatarKey,
				},
				organization: {
					name: organizations.name,
				},
			})
			.from(invites)
			.leftJoin(users, eq(invites.authorId, users.id))
			.leftJoin(organizations, eq(invites.organizationId, organizations.id))
			.where(eq(invites.id, inviteId));

		return invite;
	}

	async getInvitesByOrgSlug(orgSlug: string) {
		const invitesQuery = await db
			.select({
				invites: {
					id: invites.id,
					email: invites.email,
					role: invites.role,
					createdAt: invites.createdAt,
				},
				author: {
					id: users.id,
					name: users.name,
				},
			})
			.from(invites)
			.innerJoin(users, eq(invites.authorId, users.id))
			.innerJoin(organizations, eq(invites.organizationId, organizations.id))
			.where(eq(organizations.slug, orgSlug))
			.orderBy(asc(invites.createdAt));

		return invitesQuery;
	}

	async getInvitessWithAuthorAndOrganizationByUserEmail(userEmail: string) {
		const invitesQuery = await db
			.select({
				invites: {
					id: invites.id,
					email: invites.email,
					role: invites.role,
					createdAt: invites.createdAt,
				},
				author: {
					id: users.id,
					name: users.name,
					avatarKey: users.avatarKey,
				},
				organization: {
					name: organizations.name,
				},
			})
			.from(invites)
			.innerJoin(users, eq(invites.authorId, users.id))
			.innerJoin(organizations, eq(invites.organizationId, organizations.id))
			.where(eq(invites.email, userEmail));

		return invitesQuery;
	}

	async deleteInviteById(id: string) {
		await db.delete(invites).where(eq(invites.id, id));
	}

	async getInviteByIdAndOrgId({
		inviteId,
		organizationId,
	}: {
		inviteId: string;
		organizationId: string;
	}) {
		const invite = await db.query.invites.findFirst({
			where(fields) {
				return and(
					eq(fields.id, inviteId),
					eq(fields.organizationId, organizationId),
				);
			},
		});

		return invite;
	}

	async deleteMember(memberId: string, organizationId: string) {
		await db
			.delete(members)
			.where(
				and(
					eq(members.id, memberId),
					eq(members.organizationId, organizationId),
				),
			);
	}
}
