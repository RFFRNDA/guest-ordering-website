import { z } from 'zod';

export const envSchema = z.object({
  API_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;