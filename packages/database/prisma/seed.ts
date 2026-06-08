import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MINIO_PUBLIC_URL =
  process.env.MINIO_PUBLIC_URL ?? "http://localhost:9000";

/** Imagem padrão de teste (produto sem modelo) — ver packages/database/seed-assets/ */
const PRODUCT_IMAGE_URL = `${MINIO_PUBLIC_URL}/products/default-product.webp`;

const seedProducts = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Camiseta Básica",
    description: "Camiseta 100% algodão, corte regular",
    variants: [
      { id: "00000000-0000-4000-8000-000000000101", sku: "CAM-M-AZUL", size: "M", color: "Azul", stock: 50, acme: 49.9, globex: 54.9 },
      { id: "00000000-0000-4000-8000-000000000102", sku: "CAM-L-PRETO", size: "L", color: "Preto", stock: 40, acme: 49.9, globex: 54.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Camisa Social",
    description: "Camisa manga longa para ambiente corporativo",
    variants: [
      { id: "00000000-0000-4000-8000-000000000201", sku: "CSO-M-BRANCA", size: "M", color: "Branca", stock: 35, acme: 129.9, globex: 139.9 },
      { id: "00000000-0000-4000-8000-000000000202", sku: "CSO-G-AZUL", size: "G", color: "Azul", stock: 28, acme: 129.9, globex: 139.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Calça Alfaiataria",
    description: "Calça social slim, tecido com elastano",
    variants: [
      { id: "00000000-0000-4000-8000-000000000301", sku: "CAL-42-PRETA", size: "42", color: "Preta", stock: 25, acme: 189.9, globex: 199.9 },
      { id: "00000000-0000-4000-8000-000000000302", sku: "CAL-44-CINZA", size: "44", color: "Cinza", stock: 20, acme: 189.9, globex: 199.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "Calça Jeans",
    description: "Jeans reta, lavagem média",
    variants: [
      { id: "00000000-0000-4000-8000-000000000401", sku: "JEA-40-AZUL", size: "40", color: "Azul", stock: 45, acme: 159.9, globex: 169.9 },
      { id: "00000000-0000-4000-8000-000000000402", sku: "JEA-42-PRETO", size: "42", color: "Preto", stock: 38, acme: 159.9, globex: 169.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    name: "Vestido Executivo",
    description: "Vestido midi para escritório e eventos",
    variants: [
      { id: "00000000-0000-4000-8000-000000000501", sku: "VES-P-PRETO", size: "P", color: "Preto", stock: 18, acme: 219.9, globex: 229.9 },
      { id: "00000000-0000-4000-8000-000000000502", sku: "VES-M-VINHO", size: "M", color: "Vinho", stock: 15, acme: 219.9, globex: 229.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000006",
    name: "Saia Midi",
    description: "Saia plissada, cintura alta",
    variants: [
      { id: "00000000-0000-4000-8000-000000000601", sku: "SAI-M-BEGE", size: "M", color: "Bege", stock: 22, acme: 99.9, globex: 109.9 },
      { id: "00000000-0000-4000-8000-000000000602", sku: "SAI-G-PRETA", size: "G", color: "Preta", stock: 19, acme: 99.9, globex: 109.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000007",
    name: "Blusa Manga Longa",
    description: "Blusa leve em viscose, uso casual",
    variants: [
      { id: "00000000-0000-4000-8000-000000000701", sku: "BLU-M-ROSA", size: "M", color: "Rosa", stock: 30, acme: 79.9, globex: 84.9 },
      { id: "00000000-0000-4000-8000-000000000702", sku: "BLU-P-BRANCA", size: "P", color: "Branca", stock: 27, acme: 79.9, globex: 84.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000008",
    name: "Jaqueta Corta-vento",
    description: "Jaqueta leve impermeável, capuz removível",
    variants: [
      { id: "00000000-0000-4000-8000-000000000801", sku: "JAQ-M-PRETA", size: "M", color: "Preta", stock: 20, acme: 249.9, globex: 259.9 },
      { id: "00000000-0000-4000-8000-000000000802", sku: "JAQ-G-AZUL", size: "G", color: "Azul", stock: 16, acme: 249.9, globex: 259.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000009",
    name: "Bermuda Cargo",
    description: "Bermuda utilitária com bolsos laterais",
    variants: [
      { id: "00000000-0000-4000-8000-000000000901", sku: "BER-M-KHAKI", size: "M", color: "Khaki", stock: 32, acme: 89.9, globex: 94.9 },
      { id: "00000000-0000-4000-8000-000000000902", sku: "BER-G-PRETA", size: "G", color: "Preta", stock: 28, acme: 89.9, globex: 94.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-00000000000a",
    name: "Sapato Oxford",
    description: "Sapato social em couro sintético",
    variants: [
      { id: "00000000-0000-4000-8000-000000000a01", sku: "SAP-40-PRETO", size: "40", color: "Preto", stock: 15, acme: 279.9, globex: 289.9 },
      { id: "00000000-0000-4000-8000-000000000a02", sku: "SAP-42-MARROM", size: "42", color: "Marrom", stock: 12, acme: 279.9, globex: 289.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-00000000000b",
    name: "Tênis Casual",
    description: "Tênis confortável para o dia a dia",
    variants: [
      { id: "00000000-0000-4000-8000-000000000b01", sku: "TEN-39-BRANCO", size: "39", color: "Branco", stock: 40, acme: 199.9, globex: 209.9 },
      { id: "00000000-0000-4000-8000-000000000b02", sku: "TEN-41-PRETO", size: "41", color: "Preto", stock: 35, acme: 199.9, globex: 209.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-00000000000c",
    name: "Polo Corporativo",
    description: "Polo piquet com logo bordado opcional",
    variants: [
      { id: "00000000-0000-4000-8000-000000000c01", sku: "POL-M-AZUL", size: "M", color: "Azul", stock: 42, acme: 69.9, globex: 74.9 },
      { id: "00000000-0000-4000-8000-000000000c02", sku: "POL-G-BRANCA", size: "G", color: "Branca", stock: 36, acme: 69.9, globex: 74.9 },
    ],
  },
] as const;

async function main() {
  const tenantA = await prisma.tenant.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: { name: "Acme Corp", slug: "acme-corp" },
  });

  const tenantB = await prisma.tenant.upsert({
    where: { slug: "globex" },
    update: {},
    create: { name: "Globex Industries", slug: "globex" },
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

  for (const product of seedProducts) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: { imageUrl: PRODUCT_IMAGE_URL },
      create: {
        id: product.id,
        name: product.name,
        description: product.description,
        imageUrl: PRODUCT_IMAGE_URL,
      },
    });

    for (const variant of product.variants) {
      await prisma.productVariant.upsert({
        where: { id: variant.id },
        update: {},
        create: {
          id: variant.id,
          productId: product.id,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          inventory: {
            create: { totalStock: variant.stock, reservedStock: 0 },
          },
          tenantPrices: {
            create: [
              { tenantId: tenantA.id, price: variant.acme },
              { tenantId: tenantB.id, price: variant.globex },
            ],
          },
        },
      });
    }
  }

  console.log("Seed completed successfully");
  console.log(`Products: ${seedProducts.length} (mesma imagem padrão)`);
  console.log(`Image: ${PRODUCT_IMAGE_URL}`);
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
