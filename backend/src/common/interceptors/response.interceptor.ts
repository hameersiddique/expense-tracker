import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> { success: true; data: T; timestamp: string; }

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T> | T> {
    return next.handle().pipe(
      map((data: T) => {
        const response = context.switchToHttp().getResponse();
        const contentType = response.getHeader ? String(response.getHeader('content-type') || '') : '';
        if (contentType.includes('pdf') || contentType.includes('csv') || contentType.includes('spreadsheet') || contentType.includes('octet-stream')) {
          return data;
        }
        return { success: true as const, data, timestamp: new Date().toISOString() };
      }),
    );
  }
}
