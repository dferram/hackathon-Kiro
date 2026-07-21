import { PrismaClient } from "@prisma/client";
import process from "process";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seeding database...");

  // 1. Create Team Members (Users)
  const teamMembers = [
    { name: "Fernando", email: "fernando@troyanos.com", role: "Full-Stack" },
    { name: "Andres", email: "andres@troyanos.com", role: "Front-End" },
    { name: "Axel", email: "axel@troyanos.com", role: "Front-End" },
    { name: "Alan", email: "alan@troyanos.com", role: "Back-End" },
    { name: "Alex", email: "alex@troyanos.com", role: "Back-End" },
  ];

  console.log("Seeding Users/Team Members...");
  const seededUsers = [];
  for (const member of teamMembers) {
    const user = await prisma.user.upsert({
      where: { email: member.email },
      update: { name: member.name, role: member.role },
      create: { name: member.name, email: member.email, role: member.role },
    });
    seededUsers.push(user);
  }

  // 2. Create a default Project
  console.log("Seeding Sample Project...");
  const project = await prisma.project.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Developer Productivity Tools",
      githubRepoUrl: "https://github.com/dferram/hackathon-Kiro",
      owner: "dferram",
      repoName: "hackathon-Kiro",
    },
  });

  // 3. Create Sample Tasks (Some unassigned, some assigned)
  console.log("Seeding Tasks for Allocator...");
  const sampleTasks = [
    { title: "Design Landing Page UI", description: "Create mockup and Tailwind HTML structure", estimatedHours: 4.0 },
    { title: "Setup API Gateway Routing", description: "Define Express route endpoints", estimatedHours: 2.5 },
    { title: "Configure JWT Authentication", description: "Add login and register middleware", estimatedHours: 3.0 },
    { title: "Implement Drag & Drop Canvas", description: "Interactive workspace for tables", estimatedHours: 6.0 },
    { title: "Write API Documentation", description: "Document all exposed routes and schemas", estimatedHours: 2.0 },
  ];

  for (const task of sampleTasks) {
    await prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        estimatedHours: task.estimatedHours,
        status: "PENDING",
      },
    });
  }

  // 4. Create an initial Database Design
  console.log("Seeding Database Designs...");
  const mockCanvasData = {
    tables: [
      {
        name: "User",
        columns: [
          { name: "id", type: "Int", isPrimaryKey: true, isNullable: false },
          { name: "email", type: "String", isPrimaryKey: false, isNullable: false },
          { name: "name", type: "String", isPrimaryKey: false, isNullable: true },
        ],
      },
      {
        name: "Post",
        columns: [
          { name: "id", type: "Int", isPrimaryKey: true, isNullable: false },
          { name: "title", type: "String", isPrimaryKey: false, isNullable: false },
          { name: "authorId", type: "Int", isPrimaryKey: false, isNullable: false },
        ],
      },
    ],
  };

  await prisma.databaseDesign.create({
    data: {
      name: "E-Commerce Basic Schema",
      canvasData: JSON.stringify(mockCanvasData),
      dbType: "postgresql",
      projectId: project.id,
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
