import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DbService, Order, OrderItem } from '../db/db.service';

@Injectable()
export class OrdersService {
  constructor(private dbService: DbService) {}

  async create(
    userId: string,
    items: { productId: string; quantity: number }[],
    address: string,
    promoCode?: string,
  ): Promise<Order> {
    if (!items || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    if (!address || address.trim() === '') {
      throw new BadRequestException('Shipping address is required');
    }

    const user = await this.dbService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Add address to user's saved addresses
    await this.dbService.addUserAddress(userId, address);

    const orderItems: OrderItem[] = [];
    let total = 0;

    for (const item of items) {
      const product = await this.dbService.getProductById(item.productId);
      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.productId} not found`,
        );
      }

      const quantity = Math.max(1, Math.floor(item.quantity));

      if (
        product.stockQuantity !== undefined &&
        product.stockQuantity < quantity
      ) {
        throw new BadRequestException(
          `Not enough stock for ${product.name}. Available: ${product.stockQuantity}`,
        );
      }

      const price = product.price;
      const subtotal = price * quantity;
      total += subtotal;

      orderItems.push({
        productId: product.id,
        name: product.name,
        price,
        quantity,
      });

      // Deduct stock
      if (product.stockQuantity !== undefined) {
        await this.dbService.updateProduct(product.id, {
          stockQuantity: product.stockQuantity - quantity,
        });
      }
    }

    if (promoCode) {
      const promo = await this.dbService.getPromoByCode(promoCode);
      if (promo && promo.isActive) {
        total = total * (1 - promo.discountPercentage / 100);
      } else {
        throw new BadRequestException('Invalid or expired promo code');
      }
    }

    return this.dbService.createOrder({
      userId,
      userEmail: user.email,
      userName: user.name,
      items: orderItems,
      total,
      address,
    });
  }

  async findAll(user: any): Promise<Order[]> {
    if (user.role === 'admin') {
      return this.dbService.getOrders();
    }
    return this.dbService.getOrdersByUserId(user.id);
  }

  async updateStatus(id: string, status: Order['status']): Promise<Order> {
    const updated = await this.dbService.updateOrderStatus(id, status);
    if (!updated) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return updated;
  }

  async cancelOrder(orderId: string, userId: string): Promise<Order> {
    const orders = await this.dbService.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    if (order.userId !== userId) {
      throw new BadRequestException('You can only cancel your own orders');
    }
    if (order.status !== 'pending') {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    const updated = await this.dbService.updateOrderStatus(
      orderId,
      'cancelled',
    );
    if (!updated) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    return updated;
  }

  async getAnalytics(): Promise<any> {
    const orders = await this.dbService.getOrders();
    const validOrders = orders.filter((o) => o.status !== 'cancelled');

    const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = validOrders.length;

    // Calculate sales by product
    const productSales: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};
    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Recent orders
    const recentOrders = [...orders]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      topProducts,
      recentOrders,
    };
  }

  // Promo Codes API
  async getPromos() {
    return this.dbService.getPromos();
  }

  async createPromo(
    code: string,
    discountPercentage: number,
    isActive: boolean,
  ) {
    if (!code || discountPercentage <= 0 || discountPercentage > 100) {
      throw new BadRequestException('Invalid promo code data');
    }
    return this.dbService.createPromo({ code, discountPercentage, isActive });
  }

  async deletePromo(code: string) {
    const success = await this.dbService.deletePromo(code);
    if (!success) {
      throw new NotFoundException('Promo code not found');
    }
    return { success: true };
  }

  async validatePromo(code: string) {
    const promo = await this.dbService.getPromoByCode(code);
    if (!promo || !promo.isActive) {
      throw new BadRequestException('Invalid or expired promo code');
    }
    return promo;
  }
}
