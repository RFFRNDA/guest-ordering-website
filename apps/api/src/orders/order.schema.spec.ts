import { createOrderSchema } from './order.schema.js';

const PRODUCT_ID = '11111111-1111-4111-8111-111111111111';
const OPTION_A = '22222222-2222-4222-8222-222222222222';
const OPTION_B = '33333333-3333-4333-8333-333333333333';

const validDineIn = () => ({
  outletSlug: 'taste-sudirman',
  orderType: 'DINE_IN',
  tableNumber: 5,
  customerName: 'Rafif',
  customerEmail: 'rafif@example.com',
  paymentMethod: 'CASH',
  items: [
    {
      productId: PRODUCT_ID,
      quantity: 2,
      notes: 'tanpa es',
      optionIds: [OPTION_A, OPTION_B],
    },
  ],
});

const validTakeAway = () => {
  const { tableNumber: _unused, ...rest } = validDineIn();
  return { ...rest, orderType: 'TAKE_AWAY' };
};

const issuePaths = (input: unknown) => {
  const result = createOrderSchema.safeParse(input);
  if (result.success) return [];
  return result.error.issues.map((i) => i.path.join('.'));
};

describe('createOrderSchema', () => {
  it('menerima pesanan Dine In yang valid', () => {
    expect(createOrderSchema.safeParse(validDineIn()).success).toBe(true);
  });

  it('menerima pesanan Take Away tanpa tableNumber', () => {
    expect(createOrderSchema.safeParse(validTakeAway()).success).toBe(true);
  });

  it('menolak Dine In tanpa tableNumber', () => {
    const body: Record<string, unknown> = validDineIn();
    delete body.tableNumber;
    expect(issuePaths(body)).toContain('tableNumber');
  });

  it('menolak Take Away yang membawa tableNumber', () => {
    expect(issuePaths({ ...validTakeAway(), tableNumber: 5 })).toContain(
      'tableNumber',
    );
  });

  it('menolak tableNumber yang bukan bilangan bulat positif', () => {
    for (const tableNumber of [0, -1, 1.5, '5']) {
      expect(issuePaths({ ...validDineIn(), tableNumber })).toContain(
        'tableNumber',
      );
    }
  });

  it('menolak orderType dan paymentMethod di luar enum', () => {
    expect(issuePaths({ ...validDineIn(), orderType: 'DELIVERY' })).toContain(
      'orderType',
    );
    expect(
      issuePaths({ ...validDineIn(), paymentMethod: 'CRYPTO' }),
    ).toContain('paymentMethod');
  });

  it('memangkas spasi nama dan menolak nama kosong atau terlalu panjang', () => {
    const ok = createOrderSchema.parse({
      ...validDineIn(),
      customerName: '  Rafif  ',
    });
    expect(ok.customerName).toBe('Rafif');
    expect(issuePaths({ ...validDineIn(), customerName: '   ' })).toContain(
      'customerName',
    );
    expect(
      issuePaths({ ...validDineIn(), customerName: 'a'.repeat(61) }),
    ).toContain('customerName');
    expect(
      issuePaths({ ...validDineIn(), customerName: 'a'.repeat(60) }),
    ).toEqual([]);
  });

  it('memvalidasi format email dan memangkas spasinya', () => {
    expect(
      issuePaths({ ...validDineIn(), customerEmail: 'bukan-email' }),
    ).toContain('customerEmail');
    const ok = createOrderSchema.parse({
      ...validDineIn(),
      customerEmail: '  rafif@example.com ',
    });
    expect(ok.customerEmail).toBe('rafif@example.com');
    const tooLong = `${'a'.repeat(250)}@example.com`;
    expect(issuePaths({ ...validDineIn(), customerEmail: tooLong })).toContain(
      'customerEmail',
    );
  });

  it('membatasi kuantitas 1 sampai 20', () => {
    for (const quantity of [0, 21, 1.5, -1]) {
      const body = validDineIn();
      body.items[0].quantity = quantity;
      expect(issuePaths(body)).toContain('items.0.quantity');
    }
    for (const quantity of [1, 20]) {
      const body = validDineIn();
      body.items[0].quantity = quantity;
      expect(issuePaths(body)).toEqual([]);
    }
  });

  it('membatasi jumlah baris item 1 sampai 20', () => {
    const base = validDineIn();
    expect(issuePaths({ ...base, items: [] })).toContain('items');
    const twentyOne = Array.from({ length: 21 }, () => base.items[0]);
    expect(issuePaths({ ...base, items: twentyOne })).toContain('items');
    const twenty = Array.from({ length: 20 }, () => base.items[0]);
    expect(issuePaths({ ...base, items: twenty })).toEqual([]);
  });

  it('membatasi catatan 200 karakter dan menganggap catatan kosong sebagai tidak ada', () => {
    const body = validDineIn();
    body.items[0].notes = 'a'.repeat(201);
    expect(issuePaths(body)).toContain('items.0.notes');
    const blank = validDineIn();
    blank.items[0].notes = '   ';
    const parsed = createOrderSchema.parse(blank);
    expect(parsed.items[0].notes).toBe('');
  });

  it('menolak productId dan optionIds yang bukan UUID', () => {
    const bad = validDineIn();
    bad.items[0].productId = 'abc';
    expect(issuePaths(bad)).toContain('items.0.productId');
    const badOption = validDineIn();
    badOption.items[0].optionIds = ['abc'];
    expect(issuePaths(badOption)).toContain('items.0.optionIds.0');
  });

  it('menolak optionIds duplikat dan membatasi maksimum 20', () => {
    const dup = validDineIn();
    dup.items[0].optionIds = [OPTION_A, OPTION_A];
    expect(issuePaths(dup)).toContain('items.0.optionIds');
    const many = validDineIn();
    many.items[0].optionIds = Array.from(
      { length: 21 },
      (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    );
    expect(issuePaths(many)).toContain('items.0.optionIds');
  });

  it('memakai optionIds kosong bila tidak dikirim', () => {
    const body = validDineIn();
    const item: Record<string, unknown> = body.items[0];
    delete item.optionIds;
    const parsed = createOrderSchema.parse(body);
    expect(parsed.items[0].optionIds).toEqual([]);
  });

  it('mengabaikan field harga yang dikirim client', () => {
    const body = {
      ...validDineIn(),
      subtotal: 1,
      totalAmount: 1,
      items: [{ ...validDineIn().items[0], price: 1, unitPrice: 1 }],
    };
    const parsed = createOrderSchema.parse(body);
    expect(parsed).not.toHaveProperty('subtotal');
    expect(parsed).not.toHaveProperty('totalAmount');
    expect(parsed.items[0]).not.toHaveProperty('price');
    expect(parsed.items[0]).not.toHaveProperty('unitPrice');
  });
});