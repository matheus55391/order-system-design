import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MINIO_PUBLIC_URL =
  process.env.MINIO_PUBLIC_URL ?? "http://localhost:9000";

const PRODUCT_IMAGE_URL = `${MINIO_PUBLIC_URL}/products/default-product.webp`;

/** Cada conta demo = uma empresa (1 usuário = 1 tenant) */
const demoCompanies = [
  {
    slug: "loja-alfa",
    name: "Loja Alfa",
    email: "loja-alfa@demo.com",
  },
  {
    slug: "loja-beta",
    name: "Loja Beta",
    email: "loja-beta@demo.com",
  },
] as const;

const seedProducts = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Camiseta Básica",
    description: "Camiseta 100% algodão, corte regular",
    variants: [
      { id: "00000000-0000-4000-8000-000000000101", sku: "CAM-M-AZUL", size: "M", color: "Azul", stock: 50, alfa: 49.9, beta: 54.9 },
      { id: "00000000-0000-4000-8000-000000000102", sku: "CAM-L-PRETO", size: "L", color: "Preto", stock: 40, alfa: 49.9, beta: 54.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Camisa Social",
    description: "Camisa manga longa para ambiente corporativo",
    variants: [
      { id: "00000000-0000-4000-8000-000000000201", sku: "CSO-M-BRANCA", size: "M", color: "Branca", stock: 35, alfa: 129.9, beta: 139.9 },
      { id: "00000000-0000-4000-8000-000000000202", sku: "CSO-G-AZUL", size: "G", color: "Azul", stock: 28, alfa: 129.9, beta: 139.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Calça Alfaiataria",
    description: "Calça social slim, tecido com elastano",
    variants: [
      { id: "00000000-0000-4000-8000-000000000301", sku: "CAL-42-PRETA", size: "42", color: "Preta", stock: 25, alfa: 189.9, beta: 199.9 },
      { id: "00000000-0000-4000-8000-000000000302", sku: "CAL-44-CINZA", size: "44", color: "Cinza", stock: 20, alfa: 189.9, beta: 199.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "Calça Jeans",
    description: "Jeans reta, lavagem média",
    variants: [
      { id: "00000000-0000-4000-8000-000000000401", sku: "JEA-40-AZUL", size: "40", color: "Azul", stock: 45, alfa: 159.9, beta: 169.9 },
      { id: "00000000-0000-4000-8000-000000000402", sku: "JEA-42-PRETO", size: "42", color: "Preto", stock: 38, alfa: 159.9, beta: 169.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    name: "Vestido Executivo",
    description: "Vestido midi para escritório e eventos",
    variants: [
      { id: "00000000-0000-4000-8000-000000000501", sku: "VES-P-PRETO", size: "P", color: "Preto", stock: 18, alfa: 219.9, beta: 229.9 },
      { id: "00000000-0000-4000-8000-000000000502", sku: "VES-M-VINHO", size: "M", color: "Vinho", stock: 15, alfa: 219.9, beta: 229.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000006",
    name: "Saia Midi",
    description: "Saia plissada, cintura alta",
    variants: [
      { id: "00000000-0000-4000-8000-000000000601", sku: "SAI-M-BEGE", size: "M", color: "Bege", stock: 22, alfa: 99.9, beta: 109.9 },
      { id: "00000000-0000-4000-8000-000000000602", sku: "SAI-G-PRETA", size: "G", color: "Preta", stock: 19, alfa: 99.9, beta: 109.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000007",
    name: "Blusa Manga Longa",
    description: "Blusa leve em viscose, uso casual",
    variants: [
      { id: "00000000-0000-4000-8000-000000000701", sku: "BLU-M-ROSA", size: "M", color: "Rosa", stock: 30, alfa: 79.9, beta: 84.9 },
      { id: "00000000-0000-4000-8000-000000000702", sku: "BLU-P-BRANCA", size: "P", color: "Branca", stock: 27, alfa: 79.9, beta: 84.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000008",
    name: "Jaqueta Corta-vento",
    description: "Jaqueta leve impermeável, capuz removível",
    variants: [
      { id: "00000000-0000-4000-8000-000000000801", sku: "JAQ-M-PRETA", size: "M", color: "Preta", stock: 20, alfa: 249.9, beta: 259.9 },
      { id: "00000000-0000-4000-8000-000000000802", sku: "JAQ-G-AZUL", size: "G", color: "Azul", stock: 16, alfa: 249.9, beta: 259.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000009",
    name: "Bermuda Cargo",
    description: "Bermuda utilitária com bolsos laterais",
    variants: [
      { id: "00000000-0000-4000-8000-000000000901", sku: "BER-M-KHAKI", size: "M", color: "Khaki", stock: 32, alfa: 89.9, beta: 94.9 },
      { id: "00000000-0000-4000-8000-000000000902", sku: "BER-G-PRETA", size: "G", color: "Preta", stock: 28, alfa: 89.9, beta: 94.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-00000000000a",
    name: "Sapato Oxford",
    description: "Sapato social em couro sintético",
    variants: [
      { id: "00000000-0000-4000-8000-000000000a01", sku: "SAP-40-PRETO", size: "40", color: "Preto", stock: 15, alfa: 279.9, beta: 289.9 },
      { id: "00000000-0000-4000-8000-000000000a02", sku: "SAP-42-MARROM", size: "42", color: "Marrom", stock: 12, alfa: 279.9, beta: 289.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-00000000000b",
    name: "Tênis Casual",
    description: "Tênis confortável para o dia a dia",
    variants: [
      { id: "00000000-0000-4000-8000-000000000b01", sku: "TEN-39-BRANCO", size: "39", color: "Branco", stock: 40, alfa: 199.9, beta: 209.9 },
      { id: "00000000-0000-4000-8000-000000000b02", sku: "TEN-41-PRETO", size: "41", color: "Preto", stock: 35, alfa: 199.9, beta: 209.9 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-00000000000c",
    name: "Polo Corporativo",
    description: "Polo piquet com logo bordado opcional",
    variants: [
      { id: "00000000-0000-4000-8000-000000000c01", sku: "POL-M-AZUL", size: "M", color: "Azul", stock: 42, alfa: 69.9, beta: 74.9 },
      { id: "00000000-0000-4000-8000-000000000c02", sku: "POL-G-BRANCA", size: "G", color: "Branca", stock: 36, alfa: 69.9, beta: 74.9 },
    ],
  },
] as const;

async function resetDatabase() {
  await prisma.stockMovement.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.tenantProductPrice.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
}

async function main() {
  await resetDatabase();

  const passwordHash = await hash("password123", 10);

  const tenants = [];

  for (const company of demoCompanies) {
    const tenant = await prisma.tenant.create({
      data: { name: company.name, slug: company.slug },
    });

    await prisma.user.create({
      data: {
        email: company.email,
        passwordHash,
        name: company.name,
        role: "ADMIN",
        tenantId: tenant.id,
      },
    });

    tenants.push(tenant);
  }

  const [tenantAlfa, tenantBeta] = tenants;

  for (const product of seedProducts) {
    await prisma.product.create({
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        imageUrl: PRODUCT_IMAGE_URL,
      },
    });

    for (const variant of product.variants) {
      await prisma.productVariant.create({
        data: {
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
              { tenantId: tenantAlfa!.id, price: variant.alfa },
              { tenantId: tenantBeta!.id, price: variant.beta },
            ],
          },
        },
      });
    }
  }

  console.log("Seed completed — banco resetado");
  console.log(`Products: ${seedProducts.length}`);
  console.log(`Image: ${PRODUCT_IMAGE_URL}`);
  console.log("Contas demo (senha: password123) — cada login = uma empresa:");
  for (const c of demoCompanies) {
    console.log(`  - ${c.email} → ${c.name} (${c.slug})`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
