import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg"; // or the adapter for your database
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
// const prisma = new PrismaClient({ adapter });

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const existingPrisma = globalForPrisma.prisma as PrismaClient | undefined;
export const prisma = existingPrisma && 'incident' in existingPrisma
	? existingPrisma
	: new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;