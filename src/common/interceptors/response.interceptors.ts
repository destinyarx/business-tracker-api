import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor
  } from '@nestjs/common'
  import { Observable } from 'rxjs'
  import { map } from 'rxjs/operators'
  
  export interface ApiResponse<T> {
    statusCode: number
    message: string
    data: T
    timestamp: string
    path: string
  }
  
  export interface ControllerResponse<T> {
    data?: T
    message?: string
  }
  
  @Injectable()
  export class ResponseInterceptor<T>
    implements NestInterceptor<T, ApiResponse<T>>
  {
    intercept(
      context: ExecutionContext,
      next: CallHandler
    ): Observable<ApiResponse<T>> {
      const http = context.switchToHttp()
      const request = http.getRequest()
      const response = http.getResponse()
  
      return next.handle().pipe(
        map((data: T | ControllerResponse<T>) => {
          const isWrapped =
            typeof data === 'object' &&
            data !== null &&
            ('data' in data || 'message' in data)
  
          const extractedData = isWrapped ? data.data ?? (data as T) : (data as T)
          const message = isWrapped ? data.message ?? 'Success' : 'Success'
  
          return {
            statusCode: response?.statusCode ,
            message,
            data: extractedData,
            timestamp: new Date().toISOString(),
            path: request.url
          }
        })
      )
    }
  }
  