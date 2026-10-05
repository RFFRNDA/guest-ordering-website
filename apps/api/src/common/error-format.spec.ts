import { Body, Controller, Get, Post } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { z } from 'zod';
import { AllExceptionsFilter } from './all-exceptions.filter.js';
import { createValidationPipe } from './validation.js';

const schema = z.object({ name: z.string().min(1) });

@Controller('test')
class TestController {
  @Post()
  create(@Body({ schema }) body: z.infer<typeof schema>) {
    return body;
  }

  @Get('boom')
  boom() {
    throw new Error('secret internal detail');
  }
}

describe('format error API', () => {
  let app: INestApplication;
  let url: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        { provide: APP_PIPE, useValue: createValidationPipe() },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0, '127.0.0.1');
    url = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  const post = (body: unknown) =>
    fetch(`${url}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('menerima body yang valid', async () => {
    const res = await post({ name: 'Rafif' });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ name: 'Rafif' });
  });

  it('menolak body tidak valid dengan VALIDATION_FAILED', async () => {
    const res = await post({});
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_FAILED');
    expect(json.error.details[0].path).toBe('name');
  });

  it('mengubah 404 bawaan ke format kita', async () => {
    const res = await fetch(`${url}/tidak-ada`);
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('menyembunyikan detail error tak terduga', async () => {
    const res = await fetch(`${url}/test/boom`);
    const text = await res.text();
    expect(res.status).toBe(500);
    expect(JSON.parse(text).error.code).toBe('INTERNAL_ERROR');
    expect(text).not.toContain('secret internal detail');
  });
});