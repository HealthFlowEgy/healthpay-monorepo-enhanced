import { HttpException, Injectable } from '@nestjs/common';

@Injectable()
export class ErrorsService extends HttpException {}
