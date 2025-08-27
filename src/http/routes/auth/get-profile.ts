import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { db } from "@/db/connection";
import { auth } from "@/http/middlewares/auth";
import { BadRequestError } from "../_errors/bad-request-error";

export async function getProfile(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			"/profile",
			{
				schema: {
					tags: ["auth"],
					summary: "Get authenticate user profile",
					security: [{ bearerAuth: [] }],
					response: {
						200: z.object({
							user: z.object({
								id: z.string().uuid(),
								name: z.string().nullable(),
								email: z.email(),
								avatarUrl: z.string().url().nullable(),
							}),
						}),
					},
				},
			},
			async (request, reply) => {
				const userId = await request.getCurrentUserId();

				const user = await db.query.users.findFirst({
					columns: {
						id: true,
						name: true,
						email: true,
						avatarUrl: true,
					},
					where(fields) {
						return eq(fields.id, userId);
					},
				});

				if (!user) {
					throw new BadRequestError("User not found");
				}

				return reply.send({
					user,
				});
			},
		);
}
