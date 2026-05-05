import { httpClient } from './http-client';

export interface UploadFileResponse {
  originalFileName: string;
  storedFileName: string;
  contentType: string;
  size: number;
  relativePath: string;
  url: string;
}

export interface UploadFileParams {
  folder?: string;
}

export interface UploadMortalityRecordResult extends UploadFileResponse {
  recordUrl: string;
}

const resolveClientOrigin = (): string => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

const buildMortalityRecordUrl = (recordId: string): string => {
  return `${resolveClientOrigin()}/mortalityRecords/${recordId}`;
};

export const uploadService = {
  async uploadFile(file: File, params: UploadFileParams = {}): Promise<UploadFileResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (params.folder) {
      formData.append('folder', params.folder);
    }

    const response = await httpClient.post<UploadFileResponse>('/api/Uploads/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async uploadImage(file: File, params: UploadFileParams = {}): Promise<UploadFileResponse> {
    return uploadService.uploadFile(file, params);
  },

  getMortalityRecordUrl(recordId: string): string {
    return buildMortalityRecordUrl(recordId);
  },

  async uploadMortalityRecordImage(file: File, recordId: string): Promise<UploadMortalityRecordResult> {
    const uploaded = await uploadService.uploadFile(file, {
      folder: 'activity-daily/mortality',
    });
    return {
      ...uploaded,
      recordUrl: buildMortalityRecordUrl(recordId),
    };
  },
};
