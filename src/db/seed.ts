import { faker } from "@faker-js/faker";

import { db } from "./connection";
import {
	accounts,
	invites,
	members,
	organizations,
	tokens,
	users,
} from "./schema";

/**
 * Reset database
 */

async function seed() {
	await db.delete(invites);
	await db.delete(tokens);
	await db.delete(members);
	await db.delete(organizations);
	await db.delete(accounts);
	await db.delete(users);

	console.log("✔️ Database reset!");

	/**
	 * Create customers
	 */

	const [user, _anotherUser, _anotherUser2] = await db
		.insert(users)
		.values([
			{
				name: "John Doe",
				email: "john@acme.com",
				avatarUrl: "https://github.com/shadcn.png",
				passwordHash:
					"$2a$12$uMTAFMnwNkZFrMPTgp2TjuE2ErfdLkkYyiRhol8OVR41p1YONsDn2",
			},
			{
				name: faker.person.fullName(),
				email: faker.internet.email(),
				passwordHash:
					"$2a$12$uMTAFMnwNkZFrMPTgp2TjuE2ErfdLkkYyiRhol8OVR41p1YONsDn2",
			},
			{
				name: faker.person.fullName(),
				email: faker.internet.email(),
				passwordHash:
					"$2a$12$uMTAFMnwNkZFrMPTgp2TjuE2ErfdLkkYyiRhol8OVR41p1YONsDn2",
			},
		])
		.returning();

	console.log("✔️ Created users!");

	/**
	 * Create organization
	 */

	const [organizationAdmin, organizationMember, organizationBilling] = await db
		.insert(organizations)
		.values([
			{
				name: "Hamburgueria do Zé",
				ownerId: user.id,
				slug: "restaurante-do-ze",
				avatarUrl:
					"https://pub-9448e6c9570e405b8072625bd2387965.r2.dev/la-grotta-entrance.webp",
			},
			{
				name: "Comida em Loop",
				ownerId: user.id,
				slug: "comida-em-loop",
				avatarUrl:
					"https://pub-9448e6c9570e405b8072625bd2387965.r2.dev/franc%C3%AAs-caf%C3%A8-e-restaurante-em-paris.webp",
			},
			{
				name: "Café com Debug",
				ownerId: user.id,
				slug: "cafe-com-debug",
				avatarUrl:
					"https://pub-9448e6c9570e405b8072625bd2387965.r2.dev/restaurante-e-bar-de-segunda-tadu-arquitetura_9.jpg",
			},
		])
		.returning();

	console.log("✔️ Created organization!");

	/**
	 * Create membership
	 */

	await db
		.insert(members)
		.values([
			{
				userId: user.id,
				role: "ADMIN",
				organizationId: organizationAdmin.id,
			},
			{
				userId: user.id,
				role: "MEMBER",
				organizationId: organizationMember.id,
			},
			{
				userId: user.id,
				role: "BILLING",
				organizationId: organizationBilling.id,
			},
		])
		.returning();

	console.log("✔️ Created members!");

	console.log("✔️ Database seeded successfully");

	process.exit();
}
try {
	seed();
} catch (error) {
	console.log(error);
}
