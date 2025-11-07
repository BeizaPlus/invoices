import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { ApiResponse } from "@/lib/types";
import { z } from "zod";
import { randomBytes } from "crypto";

// Validation schema for API key
const apiKeySchema = z.object({
  name: z.string().min(1, "API key name is required"),
  expiresAt: z.string().optional(), // ISO date string
});

// GET /api/keys - List API keys
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const skip = (page - 1) * limit;

    const [keys, total] = await Promise.all([
      prisma.apiKey.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          key: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.apiKey.count(),
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        keys: keys.map(key => ({
          ...key,
          key: key.key.substring(0, 8) + '...' // Mask the key for security
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch API keys:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch API keys" },
      { status: 500 },
    );
  }
}

// POST /api/keys - Create API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = apiKeySchema.parse(body);

    // Generate a secure API key
    const keyValue = `invoice-api-key-${randomBytes(16).toString('hex')}`;

    const apiKey = await prisma.apiKey.create({
      data: {
        name: validatedData.name,
        key: keyValue,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: {
        ...apiKey,
        key: keyValue, // Return the full key only on creation
      },
      message: "API key created successfully",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Failed to create API key:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create API key" },
      { status: 500 },
    );
  }
}

// DELETE /api/keys - Delete API key
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "API key ID is required" },
        { status: 400 },
      );
    }

    // Check if API key exists
    const existingKey = await prisma.apiKey.findUnique({
      where: { id },
    });

    if (!existingKey) {
      return NextResponse.json(
        { success: false, error: "API key not found" },
        { status: 404 },
      );
    }

    // Delete the API key
    await prisma.apiKey.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: "API key deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to delete API key:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete API key" },
      { status: 500 },
    );
  }
}
