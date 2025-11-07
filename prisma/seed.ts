import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create default clients
  console.log("📋 Creating default clients...");
  const clients = [
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

  for (const client of clients) {
    await prisma.client.upsert({
      where: { id: client.id },
      update: client,
      create: client,
    });
  }
  console.log(`✅ Created ${clients.length} clients`);

  // Create default companies
  console.log("🏢 Creating default companies...");
  const companies = [
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
      swift: "",
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
      swift: "",
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
      swift: "",
      vatTin: "C0040393633",
    },
  ];

  for (const company of companies) {
    await prisma.company.upsert({
      where: { id: company.id },
      update: company,
      create: company,
    });
  }
  console.log(`✅ Created ${companies.length} companies`);

  // Create sample invoice
  console.log("🧾 Creating sample invoice...");
  const sampleInvoice = await prisma.invoice.upsert({
    where: { id: "sample-invoice-1" },
    update: {},
    create: {
      id: "sample-invoice-1",
      invoiceNumber: "INV-2024-01-001",
      docType: "INVOICE",
      status: "DRAFT",
      project: "Website Redesign Project",
      qty: 1,
      rate: 5000,
      paid: 0,
      discount: 0,
      vat: 15,
      fx: 1,
      delivered: 0,
      longDesc:
        "Complete website redesign including UI/UX design, frontend development, and responsive optimization for all devices. Includes modern design patterns, performance optimization, and SEO best practices.",
      params:
        "Responsive design, Modern UI, SEO optimization, Performance tuning",
      etaDays: 90,
      showVat: true,
      startDate: new Date("2024-01-15"),
      lockTotal: false,
      finalTotal: 0,
      totalInclVat: true,
      logoW: "560px",
      clientId: "tac",
      companyId: "active",
    },
  });

  // Create sample tasks for the invoice
  console.log("📋 Creating sample tasks...");
  const sampleTasks = [
    {
      id: "task-1",
      name: "Requirements Analysis & Planning",
      dur: 7,
      off: 0,
      invoiceId: sampleInvoice.id,
    },
    {
      id: "task-2",
      name: "UI/UX Design & Prototyping",
      dur: 21,
      off: 7,
      invoiceId: sampleInvoice.id,
    },
    {
      id: "task-3",
      name: "Frontend Development",
      dur: 35,
      off: 28,
      invoiceId: sampleInvoice.id,
    },
    {
      id: "task-4",
      name: "Testing & Quality Assurance",
      dur: 14,
      off: 63,
      invoiceId: sampleInvoice.id,
    },
    {
      id: "task-5",
      name: "Deployment & Launch",
      dur: 7,
      off: 77,
      dependsOn: "task-4",
      invoiceId: sampleInvoice.id,
    },
  ];

  for (const task of sampleTasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: task,
      create: task,
    });
  }
  console.log(`✅ Created ${sampleTasks.length} sample tasks`);

  // Create sample resources
  console.log("💼 Creating sample resources...");
  const sampleResources = [
    {
      id: "resource-1",
      type: "Senior UI/UX Designer",
      hours: 80,
      rate: 75,
      invoiceId: sampleInvoice.id,
    },
    {
      id: "resource-2",
      type: "Frontend Developer",
      hours: 120,
      rate: 65,
      invoiceId: sampleInvoice.id,
    },
    {
      id: "resource-3",
      type: "Project Manager",
      hours: 40,
      rate: 85,
      invoiceId: sampleInvoice.id,
    },
    {
      id: "resource-4",
      type: "Quality Assurance Specialist",
      hours: 32,
      rate: 55,
      invoiceId: sampleInvoice.id,
    },
  ];

  for (const resource of sampleResources) {
    await prisma.resource.upsert({
      where: { id: resource.id },
      update: resource,
      create: resource,
    });
  }
  console.log(`✅ Created ${sampleResources.length} sample resources`);

  // Create sample templates
  console.log("📄 Creating sample templates...");
  const sampleTemplates = [
    {
      id: "template-1",
      name: "Standard Invoice Template",
      data: JSON.stringify({
        docType: "Invoice",
        showVat: true,
        vat: 15,
        etaDays: 30,
        logoW: "560px",
        longDesc: "Professional services as agreed upon in the project scope.",
        params: "Standard terms and conditions apply.",
      }),
      style: JSON.stringify({
        accent: "#ef4444",
        accentDark: "#b91c1c",
        logoW: "560px",
      }),
      companyId: "active",
    },
    {
      id: "template-2",
      name: "Pro-Forma Template",
      data: JSON.stringify({
        docType: "Pro-Forma",
        showVat: true,
        vat: 15,
        etaDays: 90,
        logoW: "560px",
        longDesc: "This is a pro-forma invoice for estimation purposes only.",
        params:
          "Prices subject to change. Final invoice will be issued upon project completion.",
      }),
      style: JSON.stringify({
        accent: "#10b981",
        accentDark: "#047857",
        logoW: "560px",
      }),
      companyId: "beiza",
    },
    {
      id: "template-3",
      name: "Creative Services Template",
      data: JSON.stringify({
        docType: "Invoice",
        showVat: true,
        vat: 15,
        etaDays: 45,
        logoW: "520px",
        longDesc: "Creative design and media production services.",
        params:
          "All creative assets and intellectual property rights transferred upon full payment.",
      }),
      style: JSON.stringify({
        accent: "#8b5cf6",
        accentDark: "#7c3aed",
        logoW: "520px",
      }),
      companyId: "talking",
    },
  ];

  for (const template of sampleTemplates) {
    await prisma.template.upsert({
      where: { id: template.id },
      update: template,
      create: template,
    });
  }
  console.log(`✅ Created ${sampleTemplates.length} sample templates`);

  console.log("\n🎉 Database seeding completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   • ${clients.length} clients created`);
  console.log(`   • ${companies.length} companies created`);
  console.log(
    `   • 1 sample invoice with ${sampleTasks.length} tasks and ${sampleResources.length} resources`,
  );
  console.log(`   • ${sampleTemplates.length} invoice templates`);
  console.log(`   • 1 demo API key for testing`);
  console.log(
    "\n🚀 You can now start the development server with: npm run dev",
  );
  console.log("🌐 Demo API Key: invoice-api-key-demo-2024");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
