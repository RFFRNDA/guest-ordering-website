import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().min(1).max(20),
  notes: z.string().trim().max(200).optional(),
  optionIds: z
    .array(z.uuid())
    .max(20)
    .refine((ids) => new Set(ids).size === ids.length, {
      error: 'optionIds must not contain duplicates.',
    })
    .default([]),
});

const common = {
  outletSlug: z.string().trim().min(1).max(100),
  customerName: z.string().trim().min(1).max(60),
  customerEmail: z.string().trim().max(254).pipe(z.email()),
  paymentMethod: z.enum(['CASH', 'ONLINE']),
  items: z.array(orderItemSchema).min(1).max(20),
};

export const createOrderSchema = z.discriminatedUnion('orderType', [
  z.object({
    orderType: z.literal('DINE_IN'),
    tableNumber: z
      .number({ error: 'tableNumber is required for DINE_IN.' })
      .int()
      .positive(),
    ...common,
  }),
  z.object({
    orderType: z.literal('TAKE_AWAY'),
    tableNumber: z
      .undefined({ error: 'tableNumber must not be provided for TAKE_AWAY.' })
      .optional(),
    ...common,
  }),
]);

export type CreateOrderBody = z.infer<typeof createOrderSchema>;