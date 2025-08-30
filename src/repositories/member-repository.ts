import { and, count, eq, ne } from "drizzle-orm";
import { db, members, organizations, type Role, users } from "@/db/connection";

export class MemberRepository {
	async getMemberByEmail({
		organizationId,
		userEmail,
	}: {
		userEmail: string;
		organizationId: string;
	}) {
		const [memberWithSameEmail] = await db
			.select()
			.from(members)
			.innerJoin(users, eq(members.userId, users.id))
			.where(
				and(
					eq(members.organizationId, organizationId),
					eq(users.email, userEmail),
				),
			);

		return memberWithSameEmail;
	}

	async getMembersWithUsersByOrgId(organizationId: string) {
		const membersQuery = await db
			.select({
				members: {
					id: members.id,
					role: members.role,
				},
				users: {
					id: users.id,
					name: users.name,
					email: users.email,
					avatarKey: users.avatarKey,
				},
			})
			.from(members)
			.innerJoin(users, eq(members.userId, users.id))
			.where(eq(members.organizationId, organizationId))
			.orderBy(members.role);

		return membersQuery;
	}

	async deleteMember({
		memberId,
		organizationId,
	}: {
		memberId: string;
		organizationId: string;
	}) {
		await db
			.delete(members)
			.where(
				and(
					eq(members.id, memberId),
					eq(members.organizationId, organizationId),
				),
			);
	}

	async getMemberByIdAndOrgId({
		memberId,
		organizationId,
	}: {
		memberId: string;
		organizationId: string;
	}) {
		const [{ members: member }] = await db
			.select()
			.from(members)
			.innerJoin(organizations, eq(members.organizationId, organizations.id))
			.where(
				and(
					eq(members.id, memberId),
					eq(members.organizationId, organizationId),
				),
			);
		return member;
	}

	async updateRoleMember({
		memberId,
		organizationId,
		role,
	}: {
		memberId: string;
		organizationId: string;
		role: Role;
	}) {
		await db
			.update(members)
			.set({
				role,
			})
			.where(
				and(
					eq(members.id, memberId),
					eq(members.organizationId, organizationId),
				),
			);
	}

	async getMemberByUserIdAndOrgSlug({
		orgSlug,
		userId,
	}: {
		userId: string;
		orgSlug: string;
	}) {
		const [member] = await db
			.select({
				members,
				organizations,
			})
			.from(members)
			.innerJoin(organizations, eq(members.organizationId, organizations.id))
			.where(and(eq(members.userId, userId), eq(organizations.slug, orgSlug)));

		return member;
	}

	async getMemberByOrgIdAndUserId({
		orgId,
		userId,
	}: {
		orgId: string;
		userId: string;
	}) {
		const member = await db.query.members.findFirst({
			where(fields) {
				return and(eq(fields.organizationId, orgId), eq(fields.userId, userId));
			},
		});

		return member;
	}

	async transferOrganizationOwnership({
		orgId,
		transferToUserId,
	}: {
		transferToUserId: string;
		orgId: string;
	}) {
		await db.transaction(async (trx) => {
			await Promise.all([
				trx
					.update(members)
					.set({
						role: "ADMIN",
					})
					.where(
						and(
							eq(members.organizationId, orgId),
							eq(members.userId, transferToUserId),
						),
					),

				trx
					.update(organizations)
					.set({
						ownerId: transferToUserId,
					})
					.where(eq(organizations.id, orgId)),
			]);
		});
	}

	async countMembersNoBillingRoleByOrgId(orgId: string) {
		const memberCount = await db
			.select({ count: count() })
			.from(members)
			.where(
				and(eq(members.organizationId, orgId), ne(members.role, "BILLING")),
			)
			.then((result) => result[0].count);
		return memberCount;
	}
}
