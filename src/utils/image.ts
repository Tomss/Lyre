import { BASE_URL } from '../config';

export function getOptimizedImageUrl(
  filePath: string | null | undefined,
  width?: number,
  quality: number = 80
): string {
  if (!filePath) return '';
  if (filePath.startsWith('blob:') || filePath.startsWith('data:')) return filePath;
  if (filePath.includes('res.cloudinary.com')) {
    if (width) return filePath.replace('/upload/', '/upload/c_scale,w_' + width + ',f_auto,q_auto/');
    return filePath;
  }
  if (filePath.includes('images.pexels.com')) {
    try {
      const u = new URL(filePath);
      if (width) u.searchParams.set('w', width.toString());
      u.searchParams.set('auto', 'compress');
      u.searchParams.set('cs', 'tinysrgb');
      return u.toString();
    } catch (e) {}
  }
  if (filePath.includes('images.unsplash.com')) {
    try {
      const u = new URL(filePath);
      if (width) u.searchParams.set('w', width.toString());
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('q', quality.toString());
      return u.toString();
    } catch (e) {}
  }
  const cleanPath = filePath.startsWith('/') ? filePath : '/' + filePath;
  const fullUrl = filePath.startsWith('http') ? filePath : BASE_URL + cleanPath;
  if (cleanPath.startsWith('/uploads/')) {
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (quality && quality !== 80) params.set('q', quality.toString());
    const query = params.toString();
    return query ? fullUrl + '?' + query : fullUrl;
  }
  return fullUrl;
}

export function getImageSrcSet(filePath: string | null | undefined): string | undefined {
  if (!filePath || !filePath.includes('/uploads/')) return undefined;
  const widths = [320, 640, 960, 1280, 1600];
  return widths.map(w => getOptimizedImageUrl(filePath, w) + ' ' + w + 'w').join(', ');
}
