import { PrismaClient } from "@prisma/client";

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Database connection helper
export async function connectToDatabase() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

// Database disconnection helper
export async function disconnectFromDatabase() {
  try {
    await prisma.$disconnect();
    console.log("✅ Database disconnected successfully");
  } catch (error) {
    console.error("❌ Database disconnection failed:", error);
  }
}

// Health check for database
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("❌ Database health check failed:", error);
    return false;
  }
}

// Seed default data
export async function seedDatabase() {
  try {
    // Check if we already have data
    const existingClients = await prisma.client.count();
    if (existingClients > 0) {
      console.log("✅ Database already seeded");
      return;
    }

    // Create default clients
    const defaultClients = [
      {
        id: "gis",
        name: "Ghana International School",
        cc: "Mary Ashun",
        shipTo: "Ghana International School",
        shipCc: "Mary Ashun",
      },
      {
        id: "tac",
        name: "The Arts Council",
        cc: "Programs Office",
        shipTo: "The Arts Council – Warehouse",
        shipCc: "Receiving Desk",
      },
      {
        id: "acme",
        name: "ACME Publishing",
        cc: "Accounts Payable",
        shipTo: "ACME Warehouse #4",
        shipCc: "Dock Supervisor",
      },
      {
        id: "cif",
        name: "CarImpex",
        cc: "Francis Nyarko",
        shipTo: "CarImpex",
        shipCc: "Francis Nyarko",
      },
    ];

    await prisma.client.createMany({
      data: defaultClients,
    });

    // Create default companies
    const defaultCompanies = [
      {
        id: "active",
        name: "Active",
        logo: "ActiveLogo.svg",
        accent: "#ef4444",
        accentDark: "#b91c1c",
        logoWidth: "560px",
        contactHTML:
          "Active Studios<br>123 Design Street<br>Creative City, CC 12345<br>Tel: +1 (555) 123-4567<br>Email: hello@active.studio",
        bankName: "GT Bank",
        currency: "Ghana Cedi Account",
        accName: "Active Studios",
        accNo: "304 125 384 140",
        branch: "KNUST - Ghana",
        vatTin: "C0040393631",
      },
      {
        id: "beiza",
        name: "Beiza",
        logo: "Beiza_Logo.svg",
        accent: "#10b981",
        accentDark: "#047857",
        logoWidth: "480px",
        contactHTML:
          "Beiza Creative<br>456 Innovation Ave<br>Tech Hub, TH 67890<br>Tel: +1 (555) 987-6543<br>Email: info@beiza.com",
        bankName: "GT Bank",
        currency: "Ghana Cedi Account",
        accName: "Beiza Creative Ltd",
        accNo: "304 125 384 141",
        branch: "KNUST - Ghana",
        vatTin: "C0040393632",
      },
      {
        id: "talking",
        name: "Talking Images",
        logo: "Talking_Images_Logo.svg",
        accent: "#8b5cf6",
        accentDark: "#7c3aed",
        logoWidth: "520px",
        contactHTML:
          "Talking Images Ltd<br>789 Media Boulevard<br>Visual Valley, VV 54321<br>Tel: +1 (555) 456-7890<br>Email: contact@talkingimages.com",
        bankName: "GT Bank",
        currency: "Ghana Cedi Account",
        accName: "Talking Images Ltd",
        accNo: "304 125 384 142",
        branch: "KNUST - Ghana",
        vatTin: "C0040393633",
      },
    ];

    await prisma.company.createMany({
      data: defaultCompanies,
    });

    console.log("✅ Database seeded with default clients and companies");
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    throw error;
  }
}

// Transaction wrapper
export async function withTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>,
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    return await callback(tx as PrismaClient);
  });
}

// Error handling utilities
export function handleDatabaseError(error: any): {
  message: string;
  code?: string;
  statusCode: number;
} {
  console.error("Database error:", error);

  // Prisma specific errors
  if (error.code === "P2002") {
    return {
      message: "A record with this data already exists",
      code: error.code,
      statusCode: 409,
    };
  }

  if (error.code === "P2025") {
    return {
      message: "Record not found",
      code: error.code,
      statusCode: 404,
    };
  }

  if (error.code === "P2003") {
    return {
      message: "Foreign key constraint violation",
      code: error.code,
      statusCode: 400,
    };
  }

  // Generic database error
  return {
    message: "Database operation failed",
    statusCode: 500,
  };
}

// Cleanup function for graceful shutdown
export async function cleanup() {
  await disconnectFromDatabase();
}

// Export Prisma client as default
export default prisma;
