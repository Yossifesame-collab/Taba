export interface CompressedImageResult {
  dataUrl: string;
  originalBytes: number;
  compressedBytes: number;
  width: number;
  height: number;
  savedPercent: number;
  format: string;
}

export async function compressImageToWebP(
  file: File,
  maxWidth = 1000,
  quality = 0.82
): Promise<CompressedImageResult> {
  const originalBytes = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('ملف الصورة غير صالح'));
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const targetWidth = Math.round(img.width * scale);
        const targetHeight = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('تعذر تهيئة معالج الصور'));
          return;
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        let dataUrl = canvas.toDataURL('image/webp', quality);
        let format = 'webp';

        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          format = 'jpeg';
        }

        const base64Length = dataUrl.split(',')[1]?.length ?? 0;
        const compressedBytes = Math.round((base64Length * 3) / 4);
        const savedPercent =
          originalBytes > 0
            ? Math.max(0, Math.round(((originalBytes - compressedBytes) / originalBytes) * 100))
            : 0;

        resolve({
          dataUrl,
          originalBytes,
          compressedBytes,
          width: targetWidth,
          height: targetHeight,
          savedPercent,
          format,
        });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export function exportCsvForExcel(filename: string, headers: string[], rows: string[][]): void {
  const escapeCell = (cell: string) => `"${String(cell ?? '').replaceAll('"', '""')}"`;
  const csvLines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ];
  // UTF-8 BOM ensures Microsoft Excel opens Arabic characters cleanly
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
