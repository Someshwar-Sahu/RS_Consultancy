import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Seed Default Admin Account
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@rsbridge.com" },
    update: {},
    create: {
      email: "admin@rsbridge.com",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log("✅ Admin user created: admin@rsbridge.com (Password: Admin123!)");

  // 2. Seed Default Employee Account
  const employeePassword = await bcrypt.hash("Employee123!", 10);
  const employeeUser = await prisma.user.upsert({
    where: { email: "employee@rsbridge.com" },
    update: {},
    create: {
      email: "employee@rsbridge.com",
      passwordHash: employeePassword,
      role: UserRole.EMPLOYEE,
      isActive: true,
    },
  });
  console.log("✅ Employee user created: employee@rsbridge.com (Password: Employee123!)");

  // 3. Seed Master Skills List
  const defaultSkills = [
    { name: "No Specific Skill (Fresher)", category: "General" },
    { name: "React / Next.js", category: "IT" },
    { name: "Node.js / TypeScript", category: "IT" },
    { name: "Cold Calling & Lead Gen", category: "Sales&Marketing" },
    { name: "Customer Support (Voice)", category: "BPO" },
    { name: "Tally / Accounting", category: "BackOffice" },
    { name: "Commercial Driving (HMV)", category: "Driver" },
  ];

  for (const skill of defaultSkills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
  }
  console.log("✅ Master Skills seeded.");

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
