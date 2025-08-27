import { eq } from "drizzle-orm";

import { db, sessions } from "@/db/connection";

export class SessionRepository {
	async getSessionById(id: string) {
		const session = await db.query.sessions.findFirst({
			where(fields, { eq }) {
				return eq(fields.id, id);
			},
		});
		return session;
	}

	async createSession() {
		const [session] = await db.insert(sessions).values({}).returning();
		return session;
	}

	async createSessionWithUserId(userId: string) {
		const [session] = await db
			.insert(sessions)
			.values({
				userId,
			})
			.returning();
		return session;
	}

	async updateSessionUserId({
		sessionId,
		userId,
	}: {
		sessionId: string;
		userId: string;
	}) {
		await db.update(sessions).set({ userId }).where(eq(sessions.id, sessionId));
	}
}
