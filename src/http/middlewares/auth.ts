import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { fastifyPlugin } from "fastify-plugin";

import { db, members, organizations } from "../../db/connection";
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

			const [member] = await db
				.select({
					members,
					organizations,
				})
				.from(members)
				.innerJoin(organizations, eq(members.organizationId, organizations.id))
				.where(
					and(eq(members.userId, userId), eq(organizations.slug, orgSlug)),
				);

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
