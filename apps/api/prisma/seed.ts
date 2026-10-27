import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { envSchema } from '../src/config/env.js';

config({ path: '../../.env' });

const { DATABASE_URL } = envSchema.parse(process.env);
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DATABASE_URL }),
});

type OutletSeed = {
  slug: string;
  name: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  tableNumberLimit: number;
  serviceFee: number;
};

// Membuat outlet (atau memperbaruinya) lalu mengosongkan katalognya,
// supaya seed bisa dijalankan berulang kali tanpa data ganda.
async function resetOutlet(data: OutletSeed) {
  const outlet = await prisma.outlet.upsert({
    where: { slug: data.slug },
    update: data,
    create: data,
  });
  await prisma.orderItemOption.deleteMany({
    where: { orderItem: { order: { outletId: outlet.id } } },
  });
  await prisma.orderItem.deleteMany({
    where: { order: { outletId: outlet.id } },
  });
  await prisma.guestOrderAccess.deleteMany({
    where: { order: { outletId: outlet.id } },
  });
  await prisma.payment.deleteMany({
    where: { order: { outletId: outlet.id } },
  });
  await prisma.order.deleteMany({ 
    where: { outletId: outlet.id } 
  });
  await prisma.productOption.deleteMany({
    where: { group: { product: { outletId: outlet.id } } },
  });
  await prisma.productOptionGroup.deleteMany({
    where: { product: { outletId: outlet.id } },
  });
  await prisma.inventoryItem.deleteMany({
    where: { product: { outletId: outlet.id } },
  });
  await prisma.product.deleteMany({ where: { outletId: outlet.id } });
  await prisma.category.deleteMany({ where: { outletId: outlet.id } });
  return outlet;
}

async function main() {
  // Outlet 1: data lengkap
  const sudirman = await resetOutlet({
    slug: 'taste-sudirman',
    name: 'Taste Sudirman',
    address: 'Jl. Jenderal Sudirman No. 1, Jakarta',
    phone: '021-5550-0001',
    openTime: '08:00',
    closeTime: '22:00',
    tableNumberLimit: 20,
    serviceFee: 3000,
  });

  const minuman = await prisma.category.create({
    data: { outletId: sudirman.id, name: 'Minuman', displayOrder: 1 },
  });
  const makanan = await prisma.category.create({
    data: { outletId: sudirman.id, name: 'Makanan', displayOrder: 2 },
  });

  await prisma.product.create({
    data: {
      outletId: sudirman.id,
      categoryId: minuman.id,
      name: 'Kopi Susu',
      description: 'Espresso dengan susu segar.',
      price: 22000,
      inventory: { create: { quantity: 50, lowStockThreshold: 5 } },
      optionGroups: {
        create: [
          {
            name: 'Ukuran',
            isRequired: true,
            selectionType: 'SINGLE',
            minSelections: 1,
            maxSelections: 1,
            displayOrder: 1,
            options: {
              create: [
                { name: 'Regular', displayOrder: 1 },
                { name: 'Large', priceAdjustment: 5000, displayOrder: 2 },
              ],
            },
          },
          {
            name: 'Sugar Level',
            isRequired: true,
            selectionType: 'SINGLE',
            minSelections: 1,
            maxSelections: 1,
            displayOrder: 2,
            options: {
              create: [
                { name: 'Normal', displayOrder: 1 },
                { name: 'Less Sugar', displayOrder: 2 },
                { name: 'No Sugar', displayOrder: 3 },
              ],
            },
          },
          {
            name: 'Tambahan',
            isRequired: false,
            selectionType: 'MULTIPLE',
            minSelections: 0,
            maxSelections: 2,
            displayOrder: 3,
            options: {
              create: [
                { name: 'Extra Shot', priceAdjustment: 5000, displayOrder: 1 },
                {
                  name: 'Oat Milk',
                  priceAdjustment: 8000,
                  isAvailable: false,
                  displayOrder: 2,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      outletId: sudirman.id,
      categoryId: minuman.id,
      name: 'Es Teh Manis',
      price: 12000,
      inventory: { create: { quantity: 100, lowStockThreshold: 10 } },
    },
  });

  await prisma.product.create({
    data: {
      outletId: sudirman.id,
      categoryId: makanan.id,
      name: 'Mie Goreng',
      description: 'Mie goreng dengan telur dan sayuran.',
      price: 30000,
      inventory: { create: { quantity: 30, lowStockThreshold: 5 } },
      optionGroups: {
        create: [
          {
            name: 'Level Pedas',
            isRequired: true,
            selectionType: 'SINGLE',
            minSelections: 1,
            maxSelections: 1,
            displayOrder: 1,
            options: {
              create: [
                { name: 'Tidak Pedas', displayOrder: 1 },
                { name: 'Sedang', displayOrder: 2 },
                { name: 'Pedas', displayOrder: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      outletId: sudirman.id,
      categoryId: makanan.id,
      name: 'Nasi Goreng Spesial',
      price: 35000,
      inventory: { create: { quantity: 20, lowStockThreshold: 5 } },
      isAvailable: false,
    },
  });

  await prisma.product.create({
    data: {
      outletId: sudirman.id,
      categoryId: makanan.id,
      name: 'Menu Lama',
      price: 20000,
      inventory: { create: { quantity: 10, lowStockThreshold: 0 } },
      isActive: false,
    },
  });

  // Outlet 2: data minimal, untuk menguji pemisahan antar outlet
  const dago = await resetOutlet({
    slug: 'taste-dago',
    name: 'Taste Dago',
    address: 'Jl. Ir. H. Juanda No. 10, Bandung',
    phone: '022-5550-0002',
    openTime: '09:00',
    closeTime: '21:00',
    tableNumberLimit: 12,
    serviceFee: 3000,
  });

  const dagoMinuman = await prisma.category.create({
    data: { outletId: dago.id, name: 'Minuman', displayOrder: 1 },
  });
  await prisma.product.create({
    data: {
      outletId: dago.id,
      categoryId: dagoMinuman.id,
      name: 'Kopi Susu',
      price: 24000,
      inventory: { create: { quantity: 25, lowStockThreshold: 5 } },
    },
  });

  console.log('Seed selesai.');
}

await main().finally(() => prisma.$disconnect());