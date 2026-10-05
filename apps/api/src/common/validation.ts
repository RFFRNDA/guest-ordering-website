import {
  BadRequestException,
  StandardSchemaValidationPipe,
} from '@nestjs/common';

export const createValidationPipe = () =>
  new StandardSchemaValidationPipe({
    exceptionFactory: (issues) =>
      new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Request validation failed.',
        details: issues.map((issue) => ({
          path: (issue.path ?? [])
            .map((p) => String(typeof p === 'object' ? p.key : p))
            .join('.'),
          message: issue.message,
        })),
      }),
  });