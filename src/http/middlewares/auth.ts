import type { FastifyInstance } from "fastify";
import { fastifyPlugin } from "fastify-plugin";
import { MemberRepository } from "@/repositories/member-repository";
import { UnauthorizedError } from "../routes/_errors/unauthorized-error";

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
	app.addHook("preHandler", async (request) => {
		request.getCurrentUserId = async () => {
			try {
				const { sub } = await request.jwtVerify<{ sub: string }>();

				return sub;
			} catch {
				throw new UnauthorizedError("Invalid auth token");
			}
		};

		request.getUserMembership = async (orgSlug: string) => {
			const userId = await request.getCurrentUserId();

			const memberRepository = new MemberRepository();

			const member = await memberRepository.getMemberByUserIdAndOrgSlug({
				orgSlug,
				userId,
			});

			if (!member) {
				throw new UnauthorizedError(
					"You-re not a member of this a organization",
				);
			}

			const { organizations: organization, members: membership } = member;

			return {
				organization,
				membership,
			};
		};
	});
});
