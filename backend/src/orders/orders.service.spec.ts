import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { DbService } from '../db/db.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let dbService: Record<string, jest.Mock>;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'buyer@example.com',
    passwordHash: 'hash',
    name: 'Buyer Name',
    role: 'user' as const,
    addresses: ['123 Main St'],
  };

  const mockProduct = {
    id: 'prod-uuid-1',
    name: 'Test Headphones',
    description: 'Noise cancelling',
    price: 100,
    image: 'http://example.com/img.png',
    stockQuantity: 10,
  };

  const mockPromo = {
    code: 'PROMO20',
    discountPercentage: 20,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    dbService = {
      getUserById: jest.fn(),
      getProductById: jest.fn(),
      updateProduct: jest.fn(),
      createOrder: jest.fn(),
      getPromoByCode: jest.fn(),
      addUserAddress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersService, { provide: DbService, useValue: dbService }],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if order contains no items', async () => {
      await expect(
        service.create('user-uuid-1', [], '123 Main St'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user is not found', async () => {
      dbService.getUserById?.mockResolvedValue(undefined);
      await expect(
        service.create(
          'nonexistent-id',
          [{ productId: 'prod-uuid-1', quantity: 1 }],
          '123 Main St',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if stock is insufficient', async () => {
      dbService.getUserById?.mockResolvedValue(mockUser);
      dbService.getProductById?.mockResolvedValue({
        ...mockProduct,
        stockQuantity: 1,
      });

      await expect(
        service.create(
          'user-uuid-1',
          [{ productId: 'prod-uuid-1', quantity: 5 }],
          '123 Main St',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate total and apply promo code discount correctly', async () => {
      dbService.getUserById?.mockResolvedValue(mockUser);
      dbService.getProductById?.mockResolvedValue(mockProduct);
      dbService.getPromoByCode?.mockResolvedValue(mockPromo);
      dbService.createOrder?.mockImplementation((orderData: Record<string, unknown>) =>
        Promise.resolve({
          id: 'ORD-1234',
          status: 'pending',
          createdAt: new Date().toISOString(),
          ...orderData,
        }),
      );

      // Order 2 items @ $100 each = $200. 20% discount = $160 total.
      const result = await service.create(
        'user-uuid-1',
        [{ productId: 'prod-uuid-1', quantity: 2 }],
        '123 Main St',
        'PROMO20',
      );

      expect(dbService.updateProduct).toHaveBeenCalledWith('prod-uuid-1', {
        stockQuantity: 8, // Deducted 2 items from 10 stock
      });
      expect(result.total).toBe(160); // $200 - 20% = $160
    });
  });
});
