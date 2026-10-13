import "dotenv/config";
import { prisma } from "../src/db.js";

async function main() {
  const existing = await prisma.server.count();
  if (existing > 0) {
    console.log("Servers already seeded, skipping.");
    return;
  }

  await prisma.server.create({
    data: {
      name: "Sala de Testes",
      icon: "ST",
      channels: {
        create: [
          { name: "geral", type: "TEXT" },
          { name: "random", type: "TEXT" },
          { name: "Voz Geral", type: "VOICE" },
        ],
      },
    },
  });

  await prisma.server.create({
    data: {
      name: "Projeto Clone",
      icon: "PC",
      channels: {
        create: [
          { name: "dev", type: "TEXT" },
          { name: "design", type: "TEXT" },
          { name: "Voz Dev", type: "VOICE" },
        ],
      },
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
