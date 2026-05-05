import type { AxiosRequestConfig } from 'axios';
import axiosInstance from '@/lib/axios';
import { ApiError, parseApiError } from './errors';

async function request<TResponse, TBody = unknown>(
  config: AxiosRequestConfig<TBody>,
  fallbackMessage?: string,
): Promise<TResponse> {
  try {
    const response = await axiosInstance.request<TResponse, any, TBody>(config);
    return response.data;
  } catch (error) {
    throw parseApiError(error, fallbackMessage);
  }
}

export const apiClient = {
  request,
  get: <TResponse, TBody = unknown>(
    url: string,
    config?: AxiosRequestConfig<TBody>,
  ): Promise<TResponse> => request<TResponse, TBody>({ ...config, method: 'GET', url }),
  delete: <TResponse = void, TBody = unknown>(
    url: string,
    config?: AxiosRequestConfig<TBody>,
  ): Promise<TResponse> => request<TResponse, TBody>({ ...config, method: 'DELETE', url }),
  post: <TResponse, TBody = unknown>(
    url: string,
    data?: TBody,
    config?: AxiosRequestConfig<TBody>,
  ): Promise<TResponse> => request<TResponse, TBody>({ ...config, method: 'POST', url, data }),
  put: <TResponse, TBody = unknown>(
    url: string,
    data?: TBody,
    config?: AxiosRequestConfig<TBody>,
  ): Promise<TResponse> => request<TResponse, TBody>({ ...config, method: 'PUT', url, data }),
  patch: <TResponse, TBody = unknown>(
    url: string,
    data?: TBody,
    config?: AxiosRequestConfig<TBody>,
  ): Promise<TResponse> => request<TResponse, TBody>({ ...config, method: 'PATCH', url, data }),
  ApiError,
};
