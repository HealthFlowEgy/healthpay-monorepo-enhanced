import { SetMetadata } from '@nestjs/common';

export const ValuAuth = (...args: string[]) => SetMetadata('valu-auth', args);
