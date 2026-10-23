import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getMenu(slug: string) {
    const outlet = await this.prisma.outlet.findFirst({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        phone: true,
        openTime: true,
        closeTime: true,
        timezone: true,
        tableNumberLimit: true,
        categories: {
          where: { isActive: true },
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            products: {
              where: { isActive: true },
              orderBy: { name: 'asc' },
              select: {
                id: true,
                name: true,
                description: true,
                imageUrl: true,
                price: true,
                isAvailable: true,
                optionGroups: {
                  orderBy: { displayOrder: 'asc' },
                  select: {
                    id: true,
                    name: true,
                    isRequired: true,
                    selectionType: true,
                    minSelections: true,
                    maxSelections: true,
                    options: {
                      orderBy: { displayOrder: 'asc' },
                      select: {
                        id: true,
                        name: true,
                        priceAdjustment: true,
                        isAvailable: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!outlet) {
      throw new NotFoundException({
        code: 'OUTLET_NOT_FOUND',
        message: 'Outlet not found.',
      });
    }

    return outlet;
  }
}