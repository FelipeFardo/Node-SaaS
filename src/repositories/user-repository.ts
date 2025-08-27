import { eq } from "drizzle-orm";
import { db, members, tokens, users } from "@/db/connection";

export class UserRepository {
	async getUserById(id: string) {
		const user = await db.query.users.findFirst({
			where(fields) {
				return eq(fields.id, id);
			},
		});
		return user;
	}

	async getUserByEmail(email: string) {
		const user = await db.query.users.findFirst({
			where(fields) {
				return eq(fields.email, email);
			},
		});
		return user;
	}

	async getUserProfileById(id: string) {
		const user = await db.query.users.findFirst({
			columns: {
				id: true,
				name: true,
				email: true,
				avatarUrl: true,
			},
			where(fields) {
				return eq(fields.id, id);
			},
		});

		return user;
	}

	async createAccountAutoJoin({
		name,
		email,
		passwordHash,
		autoJoinOrganizationId,
	}: {
		name: string;
		email: string;
		passwordHash: string;
		autoJoinOrganizationId: string | null;
	}) {
		await db.transaction(async (trx) => {
			const [user] = await trx
				.insert(users)
				.values({
					name,
					email,
					passwordHash,
				})
				.returning();

			if (autoJoinOrganizationId) {
				await trx.insert(members).values({
					userId: user.id,
					organizationId: autoJoinOrganizationId,
				});
			}
		});
	}

	async updatePasswordFromReset({
		passwordHash,
		userId,
		code,
	}: {
		passwordHash: string;
		userId: string;
		code: string;
	}) {
		await db.transaction(async (trx) => {
			await trx
				.update(users)
				.set({
					passwordHash,
				})
				.where(eq(users.id, userId))
				.returning();

			await trx.delete(tokens).where(eq(tokens.id, code));
		});
	}
}
