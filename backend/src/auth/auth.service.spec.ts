import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { DbService } from '../db/db.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$mockedhashvalue'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let dbService: Record<string, jest.Mock>;
  let jwtService: { sign: jest.Mock };

  const mockUser = {
    id: 'test-uuid-1234',
    email: 'test@example.com',
    passwordHash: '$2b$10$mockedhashvalue',
    name: 'Test User',
    role: 'user' as const,
    addresses: [],
    wishlist: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    dbService = {
      getUserByEmail: jest.fn(),
      getUserById: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DbService, useValue: dbService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw BadRequestException if email is already registered', async () => {
      dbService.getUserByEmail?.mockResolvedValue(mockUser);
      await expect(
        service.register('test@example.com', 'password123', 'Test User'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully register a new user with default "user" role', async () => {
      dbService.getUserByEmail?.mockResolvedValue(undefined);
      dbService.createUser?.mockResolvedValue(mockUser);

      const result = await service.register(
        'test@example.com',
        'password123',
        'Test User',
        'user',
      );

      expect(dbService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        }),
      );
      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(result.user).toEqual(
        expect.objectContaining({
          id: 'test-uuid-1234',
          email: 'test@example.com',
          role: 'user',
        }),
      );
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException for non-existent user', async () => {
      dbService.getUserByEmail?.mockResolvedValue(undefined);
      await expect(
        service.login('nonexistent@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      dbService.getUserByEmail?.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return access_token and user info for valid credentials', async () => {
      dbService.getUserByEmail?.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('test@example.com', 'correctpassword');
      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(result.user.email).toEqual('test@example.com');
    });

    it('should allow login matching DEMO_PASSWORD when configured in environment', async () => {
      const originalEnv = process.env.DEMO_PASSWORD;
      try {
        process.env.DEMO_PASSWORD = 'env-demo-test-password';
        dbService.getUserByEmail?.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        const result = await service.login('test@example.com', 'env-demo-test-password');
        expect(result).toHaveProperty('access_token', 'mock-jwt-token');
        expect(result.user.email).toEqual('test@example.com');
      } finally {
        process.env.DEMO_PASSWORD = originalEnv;
      }
    });

    it('should preserve admin role on admin user login', async () => {
      const adminMockUser = {
        ...mockUser,
        id: 'admin-id-1',
        email: 'isha@gmail.com',
        role: 'admin' as const,
      };
      dbService.getUserByEmail?.mockResolvedValue(adminMockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('isha@gmail.com', 'correctpassword');
      expect(result.user.role).toEqual('admin');
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'admin' }),
      );
    });
  });
});
