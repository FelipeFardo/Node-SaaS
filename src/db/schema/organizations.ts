import { relations } from "drizzle-orm";
import {
	boolean,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

import { invites, members, projects, users } from ".";

export const organizations = pgTable(
	"organizations",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		domain: text("domain"),
		avatarKey: text("avatar_key"),
		shouldAttachUsersByDomain: boolean("should_attach_users_by_domain")
			.default(false)
			.notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
		ownerId: uuid("owner_id")
			.notNull()
			.references(() => users.id, {
				onDelete: "restrict",
			}),
	},
	(table) => [
		uniqueIndex("organizations_domain_key").using("btree", table.domain),
		uniqueIndex("organizations_slug_key").using("btree", table.slug),
	],
);

export const organizationsRelations = relations(
	organizations,
	({ one, many }) => ({
		members: many(members),
		invites: many(invites),
		projects: many(projects),
		owner: one(users, {
			fields: [organizations.ownerId],
			references: [users.id],
		}),
	}),
);
