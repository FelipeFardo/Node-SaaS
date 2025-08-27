import { relations } from "drizzle-orm";
import {
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

import { organizations, users } from ".";
import { Role } from "./members";

export const invites = pgTable(
	"invites",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		email: text("email").unique().notNull(),
		role: Role("role").default("MEMBER").notNull(),
		authorId: uuid("author_id").references(() => users.id, {
			onDelete: "set null",
		}),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, {
				onDelete: "cascade",
			}),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("email_organization_id_key").using(
			"btree",
			table.email,
			table.organizationId,
		),
	],
);

export const invitesRelations = relations(invites, ({ one }) => ({
	user: one(users, {
		fields: [invites.authorId],
		references: [users.id],
	}),
	organization: one(organizations, {
		fields: [invites.organizationId],
		references: [organizations.id],
	}),
}));
