import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface ErrorResponseBody {
  statusCode: number; timestamp: string; path: string; method: string; message: string | string[]; error?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') { message = res; }
      else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = (resObj.message as string | string[]) || exception.message;
        error = (resObj.error as string) || error;
      }
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      message = this.parseDbError(exception);
      error = 'Database Error';
      const driverError = exception.driverError as { code?: string; message?: string; detail?: string };
      this.logger.error(
        `DB error on ${request.method} ${request.url} — code=${driverError?.code} message=${driverError?.message} detail=${driverError?.detail} sql=${(exception as any).query}`,
      );
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    const body: ErrorResponseBody = {
      statusCode: status, timestamp: new Date().toISOString(), path: request.url, method: request.method, message, error,
    };

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} - ${status}`, exception instanceof Error ? exception.stack : String(exception));
    } else {
      this.logger.warn(`${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`);
    }
    response.status(status).json(body);
  }

  private parseDbError(exception: QueryFailedError): string {
    const driverError = exception.driverError as { code?: string; detail?: string };
    if (driverError?.code === '23505') return 'A record with these details already exists';
    if (driverError?.code === '23503') return 'Referenced record does not exist or cannot be removed due to dependencies';
    if (driverError?.code === '23502') return 'Missing required field';
    return driverError?.detail || 'Database constraint violation';
  }
}
