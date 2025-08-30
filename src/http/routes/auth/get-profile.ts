import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { auth } from "@/http/middlewares/auth";
import { UserRepository } from "@/repositories/user-repository";
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
								avatarKey: z.string().url().nullable(),
							}),
						}),
					},
				},
			},
			async (request, reply) => {
				const userId = await request.getCurrentUserId();

				const userRepository = new UserRepository();

				const user = await userRepository.getUserProfileById(userId);

				if (!user) {
					throw new BadRequestError("User not found");
				}

				return reply.send({
					user,
				});
			},
		);
}
