import { Request, Response } from 'express';
import { FileDB } from '../services/fileDatabase.js';
import { INITIAL_PRODUCTS } from '../data/initialProducts.js';
import { ProductModel } from '../models/product.model.js';
import mongoose from 'mongoose';

/**
 * 1. GET /api/products (List all products with in-memory / file fallback)
 */
export async function listProducts(_req: Request, res: Response): Promise<void> {
  try {
    let products: any[] = [];

    // 1. Try MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await ProductModel.find({ inStock: true }).lean().exec();
        if (docs && docs.length > 0) {
          products = docs.map((d: any) => ({ ...d, id: d.id || d._id?.toString() }));
        }
      } catch (e: any) {
        console.warn('[ProductController] MongoDB find warning:', e.message);
      }
    }

    // 2. Try FileDB
    if (products.length === 0) {
      products = FileDB.getProducts();
    }

    // 3. Fallback to Initial Products
    if (products.length === 0) {
      products = [...INITIAL_PRODUCTS] as any[];
    }

    // Return direct array for frontend compatibility, with multi-tier CDN edge cache headers
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
    res.status(200).json(products);
  } catch (error: any) {
    console.error('List products error:', error);
    res.status(200).json(INITIAL_PRODUCTS);
  }
}

/**
 * 2. GET /api/products/:id (Get single product by ID or slug)
 */
export async function getProductById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const all = FileDB.getProducts().length > 0 ? FileDB.getProducts() : INITIAL_PRODUCTS;
    const found = all.find((p) => p.id === id || p.slug === id);

    if (found) {
      res.status(200).json(found);
      return;
    }

    res.status(404).json({ success: false, message: 'Product not found.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
