import { HttpException } from '@nestjs/common';
import type { CreateOrderBody } from './order.schema.js';
import {
  assertOutletOpen,
  validateAndPriceOrder,
  type CatalogOutlet,
  type CatalogProduct,
} from './order-validation.js';

// Fixture meniru data seed outlet Taste Sudirman (ditambah opsi
// "Syrup" dan "Caramel" agar batas maksimum grup Tambahan bisa dites).
const KOPI = '11111111-1111-4111-8111-111111111111';
const TEH = '22222222-2222-4222-8222-222222222222';
const NASI = '33333333-3333-4333-8333-333333333333';
const MENU_LAMA = '44444444-4444-4444-8444-444444444444';
const UNKNOWN = '55555555-5555-4555-8555-555555555555';

const REGULAR = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const LARGE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';
const NORMAL = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';
const LESS = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
const EXTRA_SHOT = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
const OAT_MILK = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2';
const SYRUP = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3';
const CARAMEL = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc4';

const outlet: CatalogOutlet = {
  openTime: '08:00',
  closeTime: '22:00',
  timezone: 'Asia/Jakarta',
  tableNumberLimit: 20,
  serviceFee: 3000,
};

const products: CatalogProduct[] = [
  {
    id: KOPI,
    name: 'Kopi Susu',
    price: 22000,
    isActive: true,
    isAvailable: true,
    optionGroups: [
      {
        isRequired: true,
        selectionType: 'SINGLE',
        minSelections: 1,
        maxSelections: 1,
        options: [
          { id: REGULAR, name: 'Regular', priceAdjustment: 0, isAvailable: true },
          { id: LARGE, name: 'Large', priceAdjustment: 5000, isAvailable: true },
        ],
      },
      {
        isRequired: true,
        selectionType: 'SINGLE',
        minSelections: 1,
        maxSelections: 1,
        options: [
          { id: NORMAL, name: 'Normal', priceAdjustment: 0, isAvailable: true },
          { id: LESS, name: 'Less Sugar', priceAdjustment: 0, isAvailable: true },
        ],
      },
      {
        isRequired: false,
        selectionType: 'MULTIPLE',
        minSelections: 0,
        maxSelections: 2,
        options: [
          { id: EXTRA_SHOT, name: 'Extra Shot', priceAdjustment: 5000, isAvailable: true },
          { id: OAT_MILK, name: 'Oat Milk', priceAdjustment: 8000, isAvailable: false },
          { id: SYRUP, name: 'Syrup', priceAdjustment: 3000, isAvailable: true },
          { id: CARAMEL, name: 'Caramel', priceAdjustment: 3000, isAvailable: true },
        ],
      },
    ],
  },
  { id: TEH, name: 'Es Teh Manis', price: 12000, isActive: true, isAvailable: true, optionGroups: [] },
  { id: NASI, name: 'Nasi Goreng Spesial', price: 35000, isActive: true, isAvailable: false, optionGroups: [] },
  { id: MENU_LAMA, name: 'Menu Lama', price: 20000, isActive: false, isAvailable: true, optionGroups: [] },
];

// 2026-10-30 08:30 WIB (jam buka), supaya tes tidak bergantung jam asli.
const OPEN_NOW = new Date('2026-10-30T01:30:00Z');

const kopiItem = (overrides: Record<string, unknown> = {}) => ({
  productId: KOPI,
  quantity: 1,
  optionIds: [REGULAR, NORMAL],
  ...overrides,
});

const body = (overrides: Record<string, unknown> = {}): CreateOrderBody =>
  ({
    outletSlug: 'taste-sudirman',
    orderType: 'DINE_IN',
    tableNumber: 5,
    customerName: 'Rafif',
    customerEmail: 'rafif@example.com',
    paymentMethod: 'CASH',
    items: [kopiItem()],
    ...overrides,
  }) as CreateOrderBody;

function expectError(
  fn: () => unknown,
  status: number,
  code: string,
  details?: unknown,
) {
  let caught: unknown;
  try {
    fn();
  } catch (e) {
    caught = e;
  }
  expect(caught).toBeInstanceOf(HttpException);
  const error = caught as HttpException;
  expect(error.getStatus()).toBe(status);
  expect(error.getResponse()).toMatchObject({
    code,
    ...(details ? { details } : {}),
  });
}

const run = (b: CreateOrderBody, o = outlet, now = OPEN_NOW) =>
  validateAndPriceOrder(b, o, products, now);

describe('assertOutletOpen', () => {
  const at = (iso: string, o = outlet) => () =>
    assertOutletOpen(o, new Date(iso));

  it('buka inklusif dan tutup eksklusif pada zona waktu outlet', () => {
    expect(at('2026-10-30T01:00:00Z')).not.toThrow(); // 08:00 WIB
    expect(at('2026-10-30T14:59:00Z')).not.toThrow(); // 21:59 WIB
    expectError(at('2026-10-30T00:59:00Z'), 409, 'OUTLET_CLOSED'); // 07:59 WIB
    expectError(at('2026-10-30T15:00:00Z'), 409, 'OUTLET_CLOSED'); // 22:00 WIB
  });

  it('memakai timezone outlet, bukan timezone server', () => {
    const makassar = { ...outlet, timezone: 'Asia/Makassar' }; // UTC+8
    expect(at('2026-10-30T00:30:00Z', makassar)).not.toThrow(); // 08:30 WITA
    expectError(at('2026-10-30T00:30:00Z'), 409, 'OUTLET_CLOSED'); // 07:30 WIB
  });

  it('menangani tengah malam tanpa menghasilkan jam 24', () => {
    expectError(at('2026-10-29T17:00:00Z'), 409, 'OUTLET_CLOSED'); // 00:00 WIB
  });

  it('tidak membatasi outlet tanpa jam operasional', () => {
    const always = { ...outlet, openTime: null, closeTime: null };
    expect(at('2026-10-29T17:00:00Z', always)).not.toThrow();
  });
});

describe('validateAndPriceOrder: nomor meja', () => {
  it('menerima meja pada batas atas dan menolak di atasnya', () => {
    expect(() => run(body({ tableNumber: 20 }))).not.toThrow();
    expectError(() => run(body({ tableNumber: 21 })), 400, 'INVALID_TABLE_NUMBER');
  });

  it('tidak mengecek meja untuk Take Away', () => {
    const takeAway = body({ orderType: 'TAKE_AWAY', tableNumber: undefined });
    expect(() => run(takeAway)).not.toThrow();
  });
});

describe('validateAndPriceOrder: harga', () => {
  it('menghitung subtotal, biaya layanan, dan total dari data katalog', () => {
    const draft = run(
      body({
        items: [
          kopiItem({ quantity: 2, optionIds: [LARGE, NORMAL, EXTRA_SHOT] }),
          { productId: TEH, quantity: 1, optionIds: [] },
        ],
      }),
    );
    // Kopi: (22000 + 5000 + 5000) x 2 = 64000; Teh: 12000
    expect(draft.subtotal).toBe(76000);
    expect(draft.serviceFee).toBe(3000);
    expect(draft.totalAmount).toBe(79000);
  });

  it('menyimpan snapshot nama dan harga; unitPrice hanya harga dasar', () => {
    const draft = run(
      body({
        items: [kopiItem({ optionIds: [LARGE, NORMAL, EXTRA_SHOT], notes: 'tanpa es' })],
      }),
    );
    expect(draft.items[0]).toEqual({
      productId: KOPI,
      productNameSnapshot: 'Kopi Susu',
      unitPrice: 22000,
      quantity: 1,
      notes: 'tanpa es',
      options: [
        { optionId: LARGE, optionNameSnapshot: 'Large', priceAdjustment: 5000 },
        { optionId: NORMAL, optionNameSnapshot: 'Normal', priceAdjustment: 0 },
        { optionId: EXTRA_SHOT, optionNameSnapshot: 'Extra Shot', priceAdjustment: 5000 },
      ],
    });
  });

  it('mengubah catatan kosong menjadi null', () => {
    const draft = run(body({ items: [kopiItem({ notes: '' })] }));
    expect(draft.items[0].notes).toBeNull();
  });

  it('mengizinkan produk yang sama pada beberapa baris', () => {
    const draft = run(
      body({
        items: [
          kopiItem({ optionIds: [REGULAR, NORMAL] }),
          kopiItem({ optionIds: [LARGE, LESS] }),
        ],
      }),
    );
    expect(draft.items).toHaveLength(2);
    expect(draft.subtotal).toBe(22000 + 27000);
  });
});

describe('validateAndPriceOrder: produk', () => {
  it('menolak produk tidak dikenal, habis, atau nonaktif dengan itemIndex', () => {
    for (const productId of [UNKNOWN, NASI, MENU_LAMA]) {
      expectError(
        () =>
          run(
            body({
              items: [kopiItem(), { productId, quantity: 1, optionIds: [] }],
            }),
          ),
        409,
        'PRODUCT_UNAVAILABLE',
        { itemIndex: 1 },
      );
    }
  });
});

describe('validateAndPriceOrder: pilihan opsi', () => {
  const invalid = (optionIds: string[]) =>
    expectError(
      () => run(body({ items: [kopiItem({ optionIds })] })),
      400,
      'INVALID_OPTION_SELECTION',
      { itemIndex: 0 },
    );

  it('menolak opsi yang bukan milik produk', () => {
    invalid([REGULAR, NORMAL, UNKNOWN]);
  });

  it('menolak grup wajib yang kosong', () => {
    invalid([REGULAR]); // grup Sugar Level kosong
    invalid([]);
  });

  it('menolak lebih dari satu pilihan pada grup SINGLE', () => {
    invalid([REGULAR, LARGE, NORMAL]);
  });

  it('menolak pilihan melebihi maxSelections grup MULTIPLE', () => {
    invalid([REGULAR, NORMAL, EXTRA_SHOT, SYRUP, CARAMEL]);
  });

  it('menerima grup MULTIPLE sampai batas maksimum', () => {
    expect(() =>
      run(body({ items: [kopiItem({ optionIds: [REGULAR, NORMAL, EXTRA_SHOT, SYRUP] })] })),
    ).not.toThrow();
  });

  it('menolak opsi yang tidak tersedia dengan 409', () => {
    expectError(
      () => run(body({ items: [kopiItem({ optionIds: [REGULAR, NORMAL, OAT_MILK] })] })),
      409,
      'OPTION_UNAVAILABLE',
      { itemIndex: 0 },
    );
  });
});

describe('validateAndPriceOrder: urutan pengecekan', () => {
  it('melaporkan outlet tutup sebelum masalah meja atau item', () => {
    const closed = new Date('2026-10-30T16:00:00Z'); // 23:00 WIB
    expectError(
      () =>
        run(
          body({ tableNumber: 99, items: [{ productId: UNKNOWN, quantity: 1, optionIds: [] }] }),
          outlet,
          closed,
        ),
      409,
      'OUTLET_CLOSED',
    );
  });

  it('melaporkan meja tidak valid sebelum masalah item', () => {
    expectError(
      () =>
        run(body({ tableNumber: 99, items: [{ productId: UNKNOWN, quantity: 1, optionIds: [] }] })),
      400,
      'INVALID_TABLE_NUMBER',
    );
  });
});