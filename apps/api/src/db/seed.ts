import { db, users } from './index';
import { hash } from 'bcrypt';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Seeding database...');

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('Skipping admin user creation - ADMIN_EMAIL and ADMIN_PASSWORD not set');
    return;
  }

  // Check if admin already exists
  const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));

  if (existingAdmin.length > 0) {
    console.log('Admin user already exists');
    return;
  }

  // Create admin user
  const passwordHash = await hash(adminPassword, 10);

  await db.insert(users).values({
    email: adminEmail,
    passwordHash,
    name: 'Administrator',
    role: 'admin',
  });

  console.log('Admin user created successfully');
}

seed()
  .then(() => {
    console.log('Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });