import { hash } from "bcryptjs";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { OrganizationRepository } from "@/repositories/organization-repository";
import { UserRepository } from "@/repositories/user-repository";
import { BadRequestError } from "../_errors/bad-request-error";

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

			const userRepository = new UserRepository();
			const organizationRepository = new OrganizationRepository();

			const userWithSameEmail = await userRepository.getUserByEmail(email);

			if (userWithSameEmail) {
				throw new BadRequestError("user with same e-mail already exists.");
			}

			const [, domain] = email.split("@");

			const autoJoinOrganization =
				await organizationRepository.getOrganizationByDomain(domain);

			const passwordHash = await hash(password, 6);

			await userRepository.createAccountAutoJoin({
				email,
				name,
				passwordHash,
				autoJoinOrganizationId: autoJoinOrganization?.id || null,
			});

			return reply.status(201).send();
		},
	);
}
