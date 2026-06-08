import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenantA = await prisma.tenant.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corp",
      slug: "acme-corp",
    },
  });

  const tenantB = await prisma.tenant.upsert({
    where: { slug: "globex" },
    update: {},
    create: {
      name: "Globex Industries",
      slug: "globex",
    },
  });

  const passwordHash = await hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "buyer@acme.com" },
    update: {},
    create: {
      email: "buyer@acme.com",
      passwordHash,
      name: "Acme Buyer",
      role: "BUYER",
      tenantId: tenantA.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@acme.com" },
    update: {},
    create: {
      email: "admin@acme.com",
      passwordHash,
      name: "Acme Admin",
      role: "ADMIN",
      tenantId: tenantA.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "buyer@globex.com" },
    update: {},
    create: {
      email: "buyer@globex.com",
      passwordHash,
      name: "Globex Buyer",
      role: "BUYER",
      tenantId: tenantB.id,
    },
  });

  const tshirt = await prisma.product.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Camiseta Premium",
      description: "Camiseta 100% algodão com acabamento premium",
    },
  });

  const jacket = await prisma.product.upsert({
    where: { id: "00000000-0000-4000-8000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000002",
      name: "Jaqueta Executiva",
      description: "Jaqueta leve para uso corporativo",
    },
  });

  const variants = [
    {
      id: "00000000-0000-4000-8000-000000000101",
      productId: tshirt.id,
      sku: "TSHIRT-M-BLUE",
      size: "M",
      color: "Azul",
      stock: 50,
      acmePrice: 89.9,
      globexPrice: 95.0,
    },
    {
      id: "00000000-0000-4000-8000-000000000102",
      productId: tshirt.id,
      sku: "TSHIRT-L-BLACK",
      size: "L",
      color: "Preto",
      stock: 30,
      acmePrice: 89.9,
      globexPrice: 95.0,
    },
    {
      id: "00000000-0000-4000-8000-000000000201",
      productId: jacket.id,
      sku: "JACKET-M-GRAY",
      size: "M",
      color: "Cinza",
      stock: 10,
      acmePrice: 299.9,
      globexPrice: 319.9,
    },
  ];

  for (const variant of variants) {
    await prisma.productVariant.upsert({
      where: { id: variant.id },
      update: {},
      create: {
        id: variant.id,
        productId: variant.productId,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        inventory: {
          create: {
            totalStock: variant.stock,
            reservedStock: 0,
          },
        },
        tenantPrices: {
          create: [
            {
              tenantId: tenantA.id,
              price: variant.acmePrice,
            },
            {
              tenantId: tenantB.id,
              price: variant.globexPrice,
            },
          ],
        },
      },
    });
  }

  console.log("Seed completed successfully");
  console.log("Demo users (password: password123):");
  console.log("  - buyer@acme.com (tenant: acme-corp)");
  console.log("  - admin@acme.com (tenant: acme-corp)");
  console.log("  - buyer@globex.com (tenant: globex)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
