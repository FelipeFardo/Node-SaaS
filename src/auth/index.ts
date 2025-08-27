import type { CreateAbility, MongoAbility } from "@casl/ability";
import { AbilityBuilder, createMongoAbility } from "@casl/ability";
import { z } from "zod";

import type { User } from "./models/user";
import { permissions } from "./permissions";
import { billingSubject } from "./subjects/billing";
import { inviteSubject } from "./subjects/invite";
import { organizationSubject } from "./subjects/organization";
import { ProjectSubject } from "./subjects/project";
import { userSubject } from "./subjects/user";

export * from "./models/organization";
export * from "./models/project";
export * from "./models/user";
export * from "./roles";

const appAbilitiesSchema = z.union([
	userSubject,
	organizationSubject,
	inviteSubject,
	billingSubject,
	ProjectSubject,
	z.tuple([z.literal("manage"), z.literal("all")]),
]);

type AppAbilities = z.infer<typeof appAbilitiesSchema>;

export type AppAbility = MongoAbility<AppAbilities>;
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;

export function defineAbilityFor(user: User) {
	const builder = new AbilityBuilder(createAppAbility);

	if (typeof permissions[user.role] !== "function") {
		throw new Error(`Permissions for role ${user.role} not found.`);
	}

	permissions[user.role](user, builder);

	const ability = builder.build({
		detectSubjectType(subject) {
			return subject.__typename ?? "User";
		},
	});

	ability.can = ability.can.bind(ability);
	ability.cannot = ability.cannot.bind(ability);

	return ability;
}
