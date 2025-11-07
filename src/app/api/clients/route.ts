import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { ApiResponse } from "@/lib/types";
import { z } from "zod";

// Validation schema for client
const clientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  cc: z.string().min(1, "Contact person is required"),
  shipTo: z.string().min(1, "Shipping address is required"),
  shipCc: z.string().min(1, "Shipping contact is required"),
});

// GET /api/clients - List clients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { cc: { contains: search, mode: "insensitive" } },
        { shipTo: { contains: search, mode: "insensitive" } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.client.count({ where }),
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        clients,
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
    console.error("Failed to fetch clients:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch clients" },
      { status: 500 },
    );
  }
}

// POST /api/clients - Create client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = clientSchema.parse(body);

    const client = await prisma.client.create({
      data: validatedData,
    });

    const response: ApiResponse = {
      success: true,
      data: client,
      message: "Client created successfully",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Failed to create client:", error);

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
      { success: false, error: "Failed to create client" },
      { status: 500 },
    );
  }
}

// PUT /api/clients - Update client
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Client ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = clientSchema.partial().parse(body);

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 },
      );
    }

    // Update the client
    const updatedClient = await prisma.client.update({
      where: { id },
      data: validatedData,
    });

    const response: ApiResponse = {
      success: true,
      data: updatedClient,
      message: "Client updated successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to update client:", error);

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
      { success: false, error: "Failed to update client" },
      { status: 500 },
    );
  }
}

// DELETE /api/clients - Delete client
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Client ID is required" },
        { status: 400 },
      );
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 },
      );
    }

    // Check if client has invoices
    const invoiceCount = await prisma.invoice.count({
      where: { clientId: id },
    });

    if (invoiceCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete client. ${invoiceCount} invoice(s) are associated with this client.` 
        },
        { status: 400 },
      );
    }

    // Delete the client
    await prisma.client.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: "Client deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to delete client:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete client" },
      { status: 500 },
    );
  }
}
