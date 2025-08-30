import { relations } from "drizzle-orm";
import {
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

import { organizations, users } from ".";

export const projects = pgTable(
	"projects",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		description: text("description").notNull(),
		slug: text("slug").notNull(),
		avatarKey: text("avatar_url"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, {
				onDelete: "cascade",
			}),
		ownerId: uuid("owner_id")
			.notNull()
			.references(() => users.id, {
				onDelete: "restrict",
			}),
	},
	(table) => [uniqueIndex("projects_slug_key").using("btree", table.slug)],
);

export const projectsRelations = relations(projects, ({ one }) => ({
	organization: one(organizations, {
		fields: [projects.organizationId],
		references: [organizations.id],
	}),
	owner: one(users, {
		fields: [projects.ownerId],
		references: [users.id],
	}),
}));
