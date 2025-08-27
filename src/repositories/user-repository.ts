import { db } from "@/db/connection";

export class UserRepository {
	async getUserByEmail(email: string) {
		const user = await db.query.users.findFirst({
			where(fields, { eq }) {
				return eq(fields.email, email);
			},
		});
		return user;
	}
}
