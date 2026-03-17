import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding production database...");

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { slug: "default-org" },
    update: {},
    create: {
      name: "My Organization",
      slug: "default-org",
      plan: "FREE",
      subscriptionStatus: "TRIALING",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      maxUsers: 10,
      maxAssets: 100,
    },
  });

  // 2. Create a State
  const nsw = await prisma.state.upsert({
    where: { name_organizationId: { name: "New South Wales", organizationId: org.id } },
    update: {},
    create: { name: "New South Wales", organizationId: org.id },
  });

  // 3. Create a Region
  const region = await prisma.region.upsert({
    where: { name_stateId: { name: "Head Office", stateId: nsw.id } },
    update: {},
    create: {
      name: "Head Office",
      stateId: nsw.id,
      organizationId: org.id,
    },
  });

  // 4. Create Admin User with password
  const hashedPassword = hashSync("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@naturogroup.com.au" },
    update: {},
    create: {
      email: "admin@naturogroup.com.au",
      name: "Admin User",
      role: "SUPER_ADMIN",
      regionId: region.id,
      organizationId: org.id,
      password: hashedPassword,
      isActive: true,
    },
  });

  console.log("Seed completed successfully!");
  console.log(`  Organization: ${org.name} (${org.slug})`);
  console.log(`  State: New South Wales`);
  console.log(`  Region: Head Office`);
  console.log(`  Admin: admin@naturogroup.com.au / admin123`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
