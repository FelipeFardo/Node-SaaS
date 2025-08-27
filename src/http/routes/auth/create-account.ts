import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { db, members, users } from "@/db/connection";
import { BadRequestError } from "../_errors/bad-request-error";
// import { eq } from "drizzle-orm";

export async function createAccount(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/users",
		{
			schema: {
				tags: ["auth"],
				summary: "Create a new account",
				body: z.object({
					name: z.string(),
					email: z.email(),
					password: z.string().min(6),
				}),
			},
		},
		async (request, reply) => {
			const { name, email, password } = request.body;

			const userWithSameEmail = await db.query.users.findFirst({
				where(fields) {
					return eq(fields.email, email);
				},
			});

			if (userWithSameEmail) {
				throw new BadRequestError("user with same e-mail already exists.");
			}

			const [, domain] = email.split("@");

			const autoJoinOrganization = await db.query.organizations.findFirst({
				where(fields, { and }) {
					return and(
						eq(fields.domain, domain),
						eq(fields.shouldAttachUsersByDomain, true),
					);
				},
			});

			const passwordHash = await hash(password, 6);

			await db.transaction(async (trx) => {
				const [user] = await trx
					.insert(users)
					.values({
						name,
						email,
						passwordHash,
					})
					.returning();

				if (autoJoinOrganization) {
					await trx.insert(members).values({
						userId: user.id,
						organizationId: autoJoinOrganization.id,
					});
				}
			});

			return reply.status(201).send();
		},
	);
}
