import { apiClient, API_BASE_URL } from './base-api';

export const fileAPI = {
  uploadReceipt: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post<{ success: boolean; imageUrl: string; filename: string }>(
      '/file/upload-receipt',
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
};

export function getReceiptImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}
