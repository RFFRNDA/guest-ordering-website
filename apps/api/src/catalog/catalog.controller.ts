import { Controller, Get, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';

@Controller('outlets')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get(':slug/menu')
  getMenu(@Param('slug') slug: string) {
    return this.catalogService.getMenu(slug);
  }
}