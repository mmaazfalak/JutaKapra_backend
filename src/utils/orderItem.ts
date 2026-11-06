/**
 * Normalized Order Item helper for safe, defensive rendering across
 * Customer Orders, Receipts, Admin Dashboards, and Tracking views.
 * 
 * Prevents unhandled TypeError crashes if order items come from Supabase,
 * MongoDB, Google Sheets, or local storage in flat or nested format.
 */

export interface NormalizedOrderItem {
  id?: string;
  title: string;
  image: string;
  size: string;
  grade: string;
  era?: string;
  price: number;
  quantity: number;
  totalPrice: number;
  product?: any;
}

export function normalizeOrderItem(it: any): NormalizedOrderItem {
  if (!it || typeof it !== 'object') {
    return {
      title: 'Archival Vintage Piece',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
      size: 'Standard',
      grade: 'Archival Vintage',
      era: '1990s',
      price: 0,
      quantity: 1,
      totalPrice: 0,
      product: null,
    };
  }

  const prod = it.product && typeof it.product === 'object' ? it.product : {};

  // Title resolution
  const title = (
    prod.title ||
    it.title ||
    it.name ||
    prod.name ||
    'Archival Vintage Piece'
  ).trim();

  // Image resolution with safe fallback
  let rawImage: string = '';
  if (Array.isArray(prod.images) && prod.images.length > 0 && typeof prod.images[0] === 'string') {
    rawImage = prod.images[0];
  } else if (typeof it.image === 'string' && it.image) {
    rawImage = it.image;
  } else if (typeof it.imageUrl === 'string' && it.imageUrl) {
    rawImage = it.imageUrl;
  } else if (Array.isArray(it.images) && it.images.length > 0 && typeof it.images[0] === 'string') {
    rawImage = it.images[0];
  }

  const image = (rawImage && rawImage.trim().length > 0)
    ? rawImage
    : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80';

  // Size resolution
  const size = String(
    it.selectedSize ||
    it.size ||
    prod.size ||
    'Standard'
  );

  // Grade & Era resolution
  const grade = String(
    prod.conditionGrade ||
    it.conditionGrade ||
    prod.conditionTier ||
    'Vintage 9/10 - Archival'
  );

  const era = String(
    prod.era ||
    it.era ||
    '1990s'
  );

  // Price & Quantity
  const price = Number(prod.price) || Number(it.price) || 0;
  const quantity = Number(it.quantity) || 1;
  const totalPrice = price * quantity;

  return {
    id: prod.id || it.id || it.productId,
    title,
    image,
    size,
    grade,
    era,
    price,
    quantity,
    totalPrice,
    product: prod.title ? prod : null,
  };
}
