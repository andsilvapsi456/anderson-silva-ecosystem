/**
 * Cliente Prisma singleton (evita esgotar conexões em dev/serverless).
 * Em produção na Vercel, use a connection string com pooler (porta 6543)
 * em DATABASE_URL e a direta (5432) em DIRECT_URL.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";
