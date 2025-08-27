import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { TokenRepository } from "@/repositories/token-repository";
import { UserRepository } from "@/repositories/user-repository";

export async function requestPasswordRecover(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/password/recover",
		{
			schema: {
				tags: ["auth"],
				summary: "Request password recover",
				body: z.object({
					email: z.email(),
				}),
				response: {
					201: z.null(),
				},
			},
		},
		async (request, reply) => {
			const { email } = request.body;

			const userRepository = new UserRepository();
			const tokenRepository = new TokenRepository();
			const userFromEmail = await userRepository.getUserByEmail(email);

			if (!userFromEmail) {
				// We don't want people to know if really exists
				return reply.status(201).send();
			}

			const { id: code } = await tokenRepository.createNewToken(
				userFromEmail.id,
			);
			// Send e-mail with password recover link

			console.log("Recover password token: ", code);

			return reply.status(201).send();
		},
	);
}
