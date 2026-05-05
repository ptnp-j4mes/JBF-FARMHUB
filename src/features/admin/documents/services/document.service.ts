/**
 * Admin Module - Document Service
 * 
 * API service for document management
 */

import axiosInstance from '@/lib/axios';
import type {
  DocumentUploadRequest,
  DocumentUpdateRequest,
  DocumentResponse,
} from '../types';

const BASE_URL = '/api/Documents';

export const documentService = {
  /**
   * Get all documents
   */
  getAll: async (): Promise<DocumentResponse[]> => {
    const response = await axiosInstance.get<DocumentResponse[]>(BASE_URL);
    return response.data;
  },

  /**
   * Get document by ID
   */
  getById: async (id: number): Promise<DocumentResponse> => {
    const response = await axiosInstance.get<DocumentResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Upload new document
   */
  upload: async (data: DocumentUploadRequest): Promise<DocumentResponse> => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('title', data.title);
    formData.append('documentType', data.documentType);
    formData.append('category', data.category);
    
    if (data.description) formData.append('description', data.description);
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));
    if (data.relatedEntityType) formData.append('relatedEntityType', data.relatedEntityType);
    if (data.relatedEntityId) formData.append('relatedEntityId', data.relatedEntityId.toString());

    const response = await axiosInstance.post<DocumentResponse>(BASE_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Update document metadata
   */
  update: async (id: number, data: DocumentUpdateRequest): Promise<DocumentResponse> => {
    const response = await axiosInstance.put<DocumentResponse>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Delete document
   */
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Download document
   */
  download: async (id: number): Promise<Blob> => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
