import axiosInstance from '@/lib/axios';
import type {
  ExportPigRequest,
  PigMovementPagedResponse,
  RecordMortalityRequest,
  TransferPigRequest,
} from '../types/pig-transactions.types';

const TRANSACTIONS_URL = '/api/PigTransactions';
const inFlightLatestRequests = new Map<string, Promise<PigMovementPagedResponse>>();

export const pigTransactionsService = {
  getLatestMovements: async (page = 1, pageSize = 20, facilityCode?: string): Promise<PigMovementPagedResponse> => {
    const key = `${TRANSACTIONS_URL}/latest?page=${page}&pageSize=${pageSize}&facilityCode=${facilityCode ?? ''}`;
    const existing = inFlightLatestRequests.get(key);
    if (existing) {
      return existing;
    }

    const request = (async (): Promise<PigMovementPagedResponse> => {
    try {
      const response = await axiosInstance.get<PigMovementPagedResponse>(`${TRANSACTIONS_URL}/latest`, {
        params: { page, pageSize, facilityCode },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch latest movements', error);
      throw error;
    }
    })();

    inFlightLatestRequests.set(key, request);
    try {
      return await request;
    } finally {
      inFlightLatestRequests.delete(key);
    }
  },

  transfer: async (data: TransferPigRequest): Promise<void> => {
    await axiosInstance.post(`${TRANSACTIONS_URL}/transfer`, data);
  },

  export: async (data: ExportPigRequest): Promise<void> => {
    await axiosInstance.post(`${TRANSACTIONS_URL}/export`, data);
  },

  recordMortality: async (data: RecordMortalityRequest): Promise<void> => {
    await axiosInstance.post(`${TRANSACTIONS_URL}/mortality`, data);
  },
};
