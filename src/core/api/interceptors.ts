import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import Cookies from 'js-cookie';
import { getCurrentFacilityCode, getCurrentFacilityId } from '@/lib/facility-context';
import { beginApiLoading, endApiLoading } from '@/lib/global-loading';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _loadingTracked?: boolean;
}

let isRefreshing = false;
let pendingRequests: Array<(ok: boolean) => void> = [];

const processPendingRequests = (ok: boolean) => {
  pendingRequests.forEach((callback) => callback(ok));
  pendingRequests = [];
};

const refreshAccessToken = async (): Promise<boolean> => {
  await axios.post(
    '/api/auth/refresh',
    {},
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  return true;
};

export const attachInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const trackedConfig = config as RetryableRequestConfig;
      const skipFacilityContext = (config as InternalAxiosRequestConfig & { skipFacilityContext?: boolean }).skipFacilityContext;
      if (!trackedConfig._loadingTracked) {
        beginApiLoading();
        trackedConfig._loadingTracked = true;
      }

      delete config.headers.Authorization;

      if (!skipFacilityContext) {
        const currentFacilityId = getCurrentFacilityId();
        if (currentFacilityId && !config.headers['X-Facility-Id']) {
          config.headers['X-Facility-Id'] = String(currentFacilityId);
        }

        const currentFacilityCode = getCurrentFacilityCode();
        if (currentFacilityCode && !config.headers['X-Facility-Code']) {
          config.headers['X-Facility-Code'] = currentFacilityCode;
        }
      }
      return config;
    },
    (error) => {
      const config = error?.config as RetryableRequestConfig | undefined;
      if (config?._loadingTracked) {
        endApiLoading();
        config._loadingTracked = false;
      }
      return Promise.reject(error);
    },
  );

  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const config = response.config as RetryableRequestConfig;
      if (config?._loadingTracked) {
        endApiLoading();
        config._loadingTracked = false;
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryableRequestConfig | undefined;
      const statusCode = error.response?.status;
      if (originalRequest?._loadingTracked) {
        endApiLoading();
        originalRequest._loadingTracked = false;
      }

      if (!originalRequest || statusCode !== 401) {
        return Promise.reject(error);
      }

      const requestUrl = originalRequest.url || '';
      const isAuthEndpoint =
        requestUrl.includes('/api/auth/login') ||
        requestUrl.includes('/api/auth/refresh');

      if (isAuthEndpoint || originalRequest._retry) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push((ok) => {
            if (!ok) {
              reject(error);
              return;
            }
            resolve(instance(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        await refreshAccessToken();
        processPendingRequests(true);
        return instance(originalRequest);
      } catch (refreshError) {
        processPendingRequests(false);
        if (typeof window !== 'undefined') {
          Cookies.remove('accessToken');
          Cookies.remove('accessToken', { path: '/' });
          Cookies.remove('auth_status');
          Cookies.remove('auth_status', { path: '/' });
          localStorage.removeItem('user_info');
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );
};
