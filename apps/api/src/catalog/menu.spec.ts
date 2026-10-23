import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module.js';

type Named = { name: string };

// Butuh Docker (PostgreSQL) menyala dan data dari `npx prisma db seed`.
describe('GET /outlets/:slug/menu', () => {
  let app: INestApplication;
  let url: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0, '127.0.0.1');
    url = await app.getUrl();
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  const getMenu = (slug: string) => fetch(`${url}/outlets/${slug}/menu`);

  it('mengembalikan menu outlet aktif tanpa field internal', async () => {
    const res = await getMenu('taste-sudirman');
    const menu = await res.json();
    expect(res.status).toBe(200);
    expect(menu.slug).toBe('taste-sudirman');
    expect(menu.categories.map((c: Named) => c.name)).toEqual([
      'Minuman',
      'Makanan',
    ]);
    expect(menu).not.toHaveProperty('createdAt');
    expect(menu).not.toHaveProperty('isActive');
  });

  it('menyembunyikan produk nonaktif dan menandai produk yang habis', async () => {
    const menu = await (await getMenu('taste-sudirman')).json();
    const makanan = menu.categories.find((c: Named) => c.name === 'Makanan');
    expect(makanan.products.map((p: Named) => p.name)).toEqual([
      'Mie Goreng',
      'Nasi Goreng Spesial',
    ]);
    const nasi = makanan.products.find(
      (p: Named) => p.name === 'Nasi Goreng Spesial',
    );
    expect(nasi.isAvailable).toBe(false);
  });

  it('mengurutkan grup dan opsi, serta menandai opsi yang tidak tersedia', async () => {
    const menu = await (await getMenu('taste-sudirman')).json();
    const minuman = menu.categories.find((c: Named) => c.name === 'Minuman');
    const kopi = minuman.products.find((p: Named) => p.name === 'Kopi Susu');
    expect(kopi.optionGroups.map((g: Named) => g.name)).toEqual([
      'Ukuran',
      'Tingkat Gula',
      'Tambahan',
    ]);
    const tambahan = kopi.optionGroups[2];
    expect(tambahan.options.map((o: Named) => o.name)).toEqual([
      'Extra Shot',
      'Oat Milk',
    ]);
    expect(tambahan.options[1].isAvailable).toBe(false);
  });

  it('memisahkan menu antar outlet', async () => {
    const dago = await (await getMenu('taste-dago')).json();
    expect(dago.categories).toHaveLength(1);
    expect(dago.categories[0].products).toEqual([
      expect.objectContaining({ name: 'Kopi Susu', price: 24000 }),
    ]);
  });

  it('mengembalikan 404 OUTLET_NOT_FOUND untuk slug yang tidak dikenal', async () => {
    const res = await getMenu('tidak-ada');
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.error.code).toBe('OUTLET_NOT_FOUND');
  });
});