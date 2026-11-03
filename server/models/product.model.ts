import mongoose, { Document, Schema, Model } from 'mongoose';
import { INITIAL_PRODUCTS } from '../data/initialProducts.js';

export interface IProductDocument extends Document {
  id: string;
  slug: string;
  title: string;
  category: string;
  era: string;
  price: number;
  originalPrice?: number;
  conditionGrade: string;
  conditionTier?: string;
  size: string;
  measurements?: {
    chest?: string;
    length?: string;
    shoulders?: string;
    sleeve?: string;
    waist?: string;
    inseam?: string;
    rise?: string;
    legOpening?: string;
  };
  description: string;
  details: string[];
  images: string[];
  inStock: boolean;
  is1of1: boolean;
  isHotDeal?: boolean;
  isTrending?: boolean;
  dateAdded: string;
  dropBatch?: string;
  tags: string[];
}

const ProductSchema = new Schema<IProductDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    era: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    conditionGrade: { type: String, required: true },
    conditionTier: { type: String },
    size: { type: String, required: true },
    measurements: {
      chest: String,
      length: String,
      shoulders: String,
      sleeve: String,
      waist: String,
      inseam: String,
      rise: String,
      legOpening: String,
    },
    description: { type: String, required: true },
    details: [{ type: String }],
    images: [{ type: String }],
    inStock: { type: Boolean, default: true },
    is1of1: { type: Boolean, default: true },
    isHotDeal: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    dateAdded: { type: String, default: () => new Date().toISOString() },
    dropBatch: { type: String },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export const ProductModel: Model<IProductDocument> =
  mongoose.models.Product || mongoose.model<IProductDocument>('Product', ProductSchema);

/**
 * Ensures all existing products remain 100% preserved in MongoDB.
 * Seeds initial products only if the database collection is completely empty.
 */
export async function seedProductsIfEmpty(): Promise<number> {
  try {
    const count = await ProductModel.countDocuments();
    if (count === 0) {
      console.log(`[Database] Seeding initial product catalog (${INITIAL_PRODUCTS.length} archival items)...`);
      await ProductModel.insertMany(INITIAL_PRODUCTS);
      console.log(`✅ Seeded ${INITIAL_PRODUCTS.length} products successfully.`);
      return INITIAL_PRODUCTS.length;
    }
    return count;
  } catch (err: any) {
    console.warn('[Database] Product seed note:', err.message);
    return INITIAL_PRODUCTS.length;
  }
}

export default ProductModel;
