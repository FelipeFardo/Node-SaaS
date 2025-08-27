import "fastify";

import type { members, organizations } from "@/db/schema";

declare module "fastify" {
	export interface FastifyRequest {
		getCurrentUserId(): Promise<string>;
		getUserMembership(
			slug: string,
		): Promise<{ organization: organizations; membership: members }>;
	}
}
