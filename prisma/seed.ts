import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  return prisma;
}

seed()
  .then(() => {
    console.log("DB seeded");
  })
  .catch((error) => console.error(error));
