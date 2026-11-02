import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService, Product } from '../db/db.service';

@Injectable()
export class ProductsService {
  constructor(private dbService: DbService) {}

  async findAll(options?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sort?: string;
    ids?: string;
  }) {
    let products = await this.dbService.getProducts();

    if (options?.ids) {
      const idList = options.ids.split(',');
      products = products.filter((p) => idList.includes(p.id));
    }

    if (options?.category && options.category !== 'All') {
      products = products.filter((p) => p.category === options.category);
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }

    if (options?.sort === 'price-low') {
      products.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (options?.sort === 'price-high') {
      products.sort((a, b) => Number(b.price) - Number(a.price));
    }

    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginated = products.slice(startIndex, endIndex);

    return {
      data: paginated,
      total: products.length,
      page,
      limit,
      totalPages: Math.ceil(products.length / limit),
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.dbService.getProductById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async create(
    name: string,
    description: string,
    price: number,
    image: string,
    category?: string,
    stockQuantity?: number,
  ): Promise<Product> {
    return this.dbService.createProduct({
      name,
      description,
      price: Number(price),
      image,
      category,
      stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : 50,
    });
  }

  async update(
    id: string,
    name?: string,
    description?: string,
    price?: number,
    image?: string,
    category?: string,
    stockQuantity?: number,
  ): Promise<Product> {
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = Number(price);
    if (image !== undefined) updates.image = image;
    if (category !== undefined) updates.category = category;
    if (stockQuantity !== undefined)
      updates.stockQuantity = Number(stockQuantity);

    const updated = await this.dbService.updateProduct(id, updates);
    if (!updated) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const success = await this.dbService.deleteProduct(id);
    if (!success) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  async addReview(
    productId: string,
    userId: string,
    userName: string,
    rating: number,
    comment: string,
  ): Promise<Product> {
    const updated = await this.dbService.addProductReview(productId, {
      userId,
      userName,
      rating: Number(rating),
      comment,
      createdAt: new Date().toISOString(),
    });
    if (!updated) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    return updated;
  }
}
