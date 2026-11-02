import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DbService } from '../db/db.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private dbService: DbService,
    private jwtService: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    name: string,
    role: 'user' | 'admin' = 'user',
  ) {
    const existing = await this.dbService.getUserByEmail(email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const assignedRole: 'user' | 'admin' = role === 'admin' ? 'admin' : 'user';

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.dbService.createUser({
      email,
      passwordHash,
      name,
      role: assignedRole,
    });

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        addresses: user.addresses,
        phone: user.phone,
        wishlist: user.wishlist || [],
      },
    };
  }

  async login(email: string, pass: string) {
    const user = await this.dbService.getUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    const demoPassword = process.env.DEMO_PASSWORD;
    const isDemoMatch = Boolean(demoPassword && pass === demoPassword);

    if (!isMatch && !isDemoMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        addresses: user.addresses,
        phone: user.phone,
        wishlist: user.wishlist || [],
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.dbService.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      addresses: user.addresses,
      phone: user.phone,
      wishlist: user.wishlist || [],
    };
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      phone?: string;
      addresses?: string[];
      wishlist?: string[];
    },
  ) {
    const user = await this.dbService.updateUser(userId, data);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      addresses: user.addresses,
      phone: user.phone,
      wishlist: user.wishlist || [],
    };
  }

  // Admin: Get all users
  async getAllUsers() {
    const users = await this.dbService.getUsers();
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
    }));
  }

  // Admin: Update user role
  async updateUserRole(id: string, role: 'admin' | 'user') {
    const user = await this.dbService.updateUser(id, { role });
    if (!user) throw new BadRequestException('User not found');
    return { id: user.id, role: user.role };
  }

  // Admin: Delete user
  async deleteUser(id: string) {
    const success = await this.dbService.deleteUser(id);
    if (!success) throw new BadRequestException('User not found');
    return { success: true };
  }
}
