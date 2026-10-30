import { BadRequestException, ConflictException } from '@nestjs/common';
import type { CreateOrderBody } from './order.schema.js';

// Bentuk data katalog yang dibutuhkan. Sengaja struktural (bukan tipe Prisma) supaya fungsi-fungsi ini murni dan bisa dites tanpa database.
export type CatalogOutlet = {
  openTime: string | null;
  closeTime: string | null;
  timezone: string;
  tableNumberLimit: number;
  serviceFee: number;
};

export type CatalogOption = {
  id: string;
  name: string;
  priceAdjustment: number;
  isAvailable: boolean;
};

export type CatalogOptionGroup = {
  isRequired: boolean;
  selectionType: 'SINGLE' | 'MULTIPLE';
  minSelections: number;
  maxSelections: number | null;
  options: CatalogOption[];
};

export type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  isAvailable: boolean;
  optionGroups: CatalogOptionGroup[];
};

export type PricedItem = {
  productId: string;
  productNameSnapshot: string;
  unitPrice: number; // harga dasar produk saja
  quantity: number;
  notes: string | null;
  options: {
    optionId: string;
    optionNameSnapshot: string;
    priceAdjustment: number;
  }[];
};

export type OrderDraft = {
  items: PricedItem[];
  subtotal: number;
  serviceFee: number;
  totalAmount: number;
};

// Jam lokal outlet dalam format "HH:mm" (zero-padded, bisa dibandingkan sebagai string).
function localTime(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get('hour')}:${get('minute')}`;
}

// Buka inklusif, tutup eksklusif. Outlet tanpa jam operasional tidak dibatasi.
export function assertOutletOpen(outlet: CatalogOutlet, now: Date) {
  if (!outlet.openTime || !outlet.closeTime) return;
  const time = localTime(now, outlet.timezone);
  if (time < outlet.openTime || time >= outlet.closeTime) {
    throw new ConflictException({
      code: 'OUTLET_CLOSED',
      message: 'The outlet is not accepting orders right now.',
    });
  }
}

// Bentuk (wajib/dilarang) sudah dijaga Zod; di sini hanya cek batas atas.
export function assertValidTableNumber(
  outlet: CatalogOutlet,
  body: CreateOrderBody,
) {
  if (body.orderType !== 'DINE_IN') return;
  if (body.tableNumber > outlet.tableNumberLimit) {
    throw new BadRequestException({
      code: 'INVALID_TABLE_NUMBER',
      message: `Table number must be between 1 and ${outlet.tableNumberLimit}.`,
    });
  }
}

const invalidSelection = (itemIndex: number, message: string) =>
  new BadRequestException({
    code: 'INVALID_OPTION_SELECTION',
    message,
    details: { itemIndex },
  });

// Memvalidasi pilihan opsi satu item terhadap grup-grup produknya, lalu mengembalikan opsi terpilih lengkap dengan snapshot nama dan harga.
function resolveOptions(
  product: CatalogProduct,
  optionIds: string[],
  itemIndex: number,
) {
  const groupOf = new Map<string, CatalogOptionGroup>();
  const optionById = new Map<string, CatalogOption>();
  for (const group of product.optionGroups) {
    for (const option of group.options) {
      groupOf.set(option.id, group);
      optionById.set(option.id, option);
    }
  }

  const countPerGroup = new Map<CatalogOptionGroup, number>();
  const selected: CatalogOption[] = [];
  for (const id of optionIds) {
    const option = optionById.get(id);
    const group = groupOf.get(id);
    if (!option || !group) {
      throw invalidSelection(itemIndex, 'Option does not belong to the product.');
    }
    if (!option.isAvailable) {
      throw new ConflictException({
        code: 'OPTION_UNAVAILABLE',
        message: `Option "${option.name}" is not available.`,
        details: { itemIndex },
      });
    }
    countPerGroup.set(group, (countPerGroup.get(group) ?? 0) + 1);
    selected.push(option);
  }

  for (const group of product.optionGroups) {
    const count = countPerGroup.get(group) ?? 0;
    const min = group.isRequired
      ? Math.max(group.minSelections, 1)
      : group.minSelections;
    const max = group.selectionType === 'SINGLE' ? 1 : group.maxSelections;
    if (count < min) {
      throw invalidSelection(itemIndex, 'A required option group is incomplete.');
    }
    if (max !== null && count > max) {
      throw invalidSelection(itemIndex, 'Too many options selected in a group.');
    }
  }

  return selected;
}

// Harga selalu dihitung dari data katalog, tidak pernah dari client.
function priceItems(
  items: CreateOrderBody['items'],
  products: CatalogProduct[],
) {
  const productById = new Map(products.map((p) => [p.id, p]));

  return items.map((item, itemIndex): PricedItem => {
    const product = productById.get(item.productId);
    if (!product || !product.isActive || !product.isAvailable) {
      throw new ConflictException({
        code: 'PRODUCT_UNAVAILABLE',
        message: 'A product in the order is not available.',
        details: { itemIndex },
      });
    }
    const options = resolveOptions(product, item.optionIds, itemIndex);
    return {
      productId: product.id,
      productNameSnapshot: product.name,
      unitPrice: product.price,
      quantity: item.quantity,
      notes: item.notes ? item.notes : null,
      options: options.map((o) => ({
        optionId: o.id,
        optionNameSnapshot: o.name,
        priceAdjustment: o.priceAdjustment,
      })),
    };
  });
}

// Urutan cek: jam outlet -> nomor meja -> item. Error pertama yang dilempar.
// `products` = produk milik outlet ini saja; yang tidak ada di daftar dianggap tidak tersedia (termasuk produk milik outlet lain).
export function validateAndPriceOrder(
  body: CreateOrderBody,
  outlet: CatalogOutlet,
  products: CatalogProduct[],
  now: Date,
): OrderDraft {
  assertOutletOpen(outlet, now);
  assertValidTableNumber(outlet, body);
  const items = priceItems(body.items, products);

  const subtotal = items.reduce((sum, item) => {
    const adjustments = item.options.reduce((s, o) => s + o.priceAdjustment, 0);
    return sum + (item.unitPrice + adjustments) * item.quantity;
  }, 0);

  return {
    items,
    subtotal,
    serviceFee: outlet.serviceFee,
    totalAmount: subtotal + outlet.serviceFee,
  };
}