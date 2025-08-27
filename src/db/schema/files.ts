import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const files = pgTable("files", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name"),
	key: text("key"),
	url: text("url"),
	contentType: text("content_type").notNull().default("image/png"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
