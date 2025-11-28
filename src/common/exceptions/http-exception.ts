import {
  Catch,
  HttpStatus,
  ArgumentsHost,
  HttpException,
  ExceptionFilter,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const details =
      status === HttpStatus.INTERNAL_SERVER_ERROR
        ? { message: 'An unexpected error occurred.' }
        : exception instanceof HttpException
          ? exception.getResponse()
          : { message: 'An error occurred' };

    response.status(status).json({
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      statusCode: status,
      details,
    });
  }
}
