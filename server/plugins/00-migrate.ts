import { join } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

export default defineNitroPlugin(async () => {
	if (process.env.SKIP_DB_MIGRATIONS === "true") {
		return;
	}

	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		if (process.env.NODE_ENV === "production") {
			throw new Error("DATABASE_URL is not set");
		}
		return;
	}

	const migrationsFolder = join(process.cwd(), "drizzle");
	const client = postgres(databaseUrl, { max: 1 });

	try {
		await migrate(drizzle(client), { migrationsFolder });
		console.log("[migrate] Database migrations applied");
	} finally {
		await client.end();
	}
});
