import { relations } from "drizzle-orm";
import { pgEnum, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { users } from ".";

export const AccountProvider = pgEnum("AccountProvider", ["GITHUB"]);

export const accounts = pgTable(
	"accounts",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		provider: AccountProvider("provider").default("GITHUB").notNull(),
		providerAccountId: text("provider_account_id").notNull(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
	},
	(table) => [
		uniqueIndex("accounts_provider_account_id_key").using(
			"btree",
			table.providerAccountId,
		),
		uniqueIndex("accounts_provider_user_id_key").using(
			"btree",
			table.provider,
			table.userId,
		),
	],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id],
	}),
}));
