import { relations } from "drizzle-orm";
import { pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from ".";

export const TokenType = pgEnum("TokenType", ["PASSWORD_RECOVER"]);

export const tokens = pgTable("tokens", {
	id: uuid("id").primaryKey().defaultRandom(),
	type: TokenType("type").default("PASSWORD_RECOVER").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
});

export const tokensRelations = relations(tokens, ({ one }) => ({
	user: one(users, {
		fields: [tokens.userId],
		references: [users.id],
	}),
}));
