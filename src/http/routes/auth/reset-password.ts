import { hash } from "bcryptjs";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

import { TokenRepository } from "@/repositories/token-repository";
import { UserRepository } from "@/repositories/user-repository";
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

			const userRepository = new UserRepository();
			const tokenRepository = new TokenRepository();

			const tokenFromCode = await tokenRepository.getTokenFromCode(code);

			if (!tokenFromCode) {
				throw new UnauthorizedError();
			}

			const passwordHash = await hash(password, 6);

			await userRepository.updatePasswordFromReset({
				passwordHash,
				userId: tokenFromCode.userId,
				code,
			});

			return reply.status(204).send();
		},
	);
}
