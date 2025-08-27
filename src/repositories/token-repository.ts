import { eq } from "drizzle-orm";
import { db, tokens } from "@/db/connection";

export class TokenRepository {
	async createNewToken(userId: string) {
		const [token] = await db
			.insert(tokens)
			.values({
				type: "PASSWORD_RECOVER",
				userId: userId,
			})
			.returning();

		return token;
	}

	async getTokenFromCode(code: string) {
		const tokenFromCode = await db.query.tokens.findFirst({
			where(fields) {
				return eq(fields.id, code);
			},
		});

		return tokenFromCode;
	}
}
