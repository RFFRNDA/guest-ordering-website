import { envSchema } from './env.js';

describe('envSchema', () => {
  it('menolak config tanpa DATABASE_URL', () => {
    expect(() => envSchema.parse({})).toThrow();
  });

  it('memakai port 4000 jika API_PORT tidak diisi', () => {
    const env = envSchema.parse({ DATABASE_URL: 'postgresql://x' });
    expect(env.API_PORT).toBe(4000);
  });

  it('mengubah API_PORT dari teks menjadi angka', () => {
    const env = envSchema.parse({ DATABASE_URL: 'postgresql://x', API_PORT: '5000' });
    expect(env.API_PORT).toBe(5000);
  });
});