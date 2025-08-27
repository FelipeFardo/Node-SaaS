import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

import { db, tokens, users } from "@/db/connection";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function resetPassword(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/password/reset",
		{
			schema: {
				tags: ["auth"],
				summary: "Reset password",
				body: z.object({
					code: z.string(),
					password: z.string().min(6),
				}),
			},
		},
		async (request, reply) => {
			const { code, password } = request.body;

			const tokenFromCode = await db.query.tokens.findFirst({
				where(fields) {
					return eq(fields.id, code);
				},
			});

			if (!tokenFromCode) {
				throw new UnauthorizedError();
			}

			const passwordHash = await hash(password, 6);

			await db.transaction(async (trx) => {
				await trx
					.update(users)
					.set({
						passwordHash,
					})
					.where(eq(users.id, tokenFromCode.userId))
					.returning();

				await trx.delete(tokens).where(eq(tokens.id, code));
			});

			return reply.status(204).send();
		},
	);
}
