import { relations } from "drizzle-orm";
import { pgEnum, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { organizations, users } from ".";

export const Role = pgEnum("Role", ["ADMIN", "MEMBER", "BILLING"]);

export const members = pgTable(
	"members",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		role: Role("role").default("MEMBER").notNull(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, {
				onDelete: "cascade",
			}),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
	},
	(table) => [
		uniqueIndex("members_organization_id_user_id_key").using(
			"btree",
			table.organizationId,
			table.userId,
		),
	],
);

export const membersRelations = relations(members, ({ one }) => ({
	organization: one(organizations, {
		fields: [members.organizationId],
		references: [organizations.id],
	}),
	user: one(users, {
		fields: [members.userId],
		references: [users.id],
	}),
}));
