import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { ApiResponse } from "@/lib/types";
import { z } from "zod";

// Validation schema for company
const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  logo: z.string().optional(),
  accent: z.string().default("#ef4444"),
  accentDark: z.string().default("#b91c1c"),
  logoWidth: z.string().default("560px"),
  contactHTML: z.string().optional(),
  bankName: z.string().optional(),
  currency: z.string().optional(),
  accName: z.string().optional(),
  accNo: z.string().optional(),
  branch: z.string().optional(),
  swift: z.string().optional(),
  vatTin: z.string().optional(),
});

// GET /api/companies - List companies
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
        { accName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.company.count({ where }),
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        companies,
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
    console.error("Failed to fetch companies:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch companies" },
      { status: 500 },
    );
  }
}

// POST /api/companies - Create company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = companySchema.parse(body);

    const company = await prisma.company.create({
      data: validatedData,
    });

    const response: ApiResponse = {
      success: true,
      data: company,
      message: "Company created successfully",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Failed to create company:", error);

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
      { success: false, error: "Failed to create company" },
      { status: 500 },
    );
  }
}

// PUT /api/companies - Update company
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = companySchema.partial().parse(body);

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 },
      );
    }

    // Update the company
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: validatedData,
    });

    const response: ApiResponse = {
      success: true,
      data: updatedCompany,
      message: "Company updated successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to update company:", error);

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
      { success: false, error: "Failed to update company" },
      { status: 500 },
    );
  }
}

// DELETE /api/companies - Delete company
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 },
      );
    }

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 },
      );
    }

    // Check if company has invoices
    const invoiceCount = await prisma.invoice.count({
      where: { companyId: id },
    });

    if (invoiceCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete company. ${invoiceCount} invoice(s) are associated with this company.` 
        },
        { status: 400 },
      );
    }

    // Delete the company
    await prisma.company.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: "Company deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to delete company:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete company" },
      { status: 500 },
    );
  }
}
