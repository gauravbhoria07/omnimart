import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface PromoCode {
  code: string;
  discountPercentage: number;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'user' | 'admin';
  addresses: string[];
  phone?: string;
  wishlist?: string[];
}

export interface ProductReview {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category?: string;
  reviews?: ProductReview[];
  stockQuantity?: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: OrderItem[];
  total: number;
  address: string;
  status:
    | 'pending'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'completed'
    | 'cancelled';
  statusHistory?: { status: string; timestamp: string }[];
  createdAt: string;
}

@Injectable()
export class DbService implements OnModuleInit {
  private readonly logger = new Logger(DbService.name);

  private readonly dataDir: string = this.resolveDataDir();
  private readonly usersFile = path.join(this.dataDir, 'users.json');
  private readonly productsFile = path.join(this.dataDir, 'products.json');
  private readonly ordersFile = path.join(this.dataDir, 'orders.json');
  private readonly promosFile = path.join(this.dataDir, 'promos.json');

  private users: User[] = [];
  private products: Product[] = [];
  private orders: Order[] = [];
  private promos: PromoCode[] = [];

  private resolveDataDir(): string {
    const candidatePaths = [
      path.join(process.cwd(), 'data'),
      path.join(process.cwd(), 'backend', 'data'),
      path.join(__dirname, '..', '..', 'data'),
      path.join(__dirname, '..', '..', 'backend', 'data'),
    ];

    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    const fallback = path.join(process.cwd(), 'data');
    if (!fs.existsSync(fallback)) {
      try {
        fs.mkdirSync(fallback, { recursive: true });
      } catch {
        // Directory will be created during ensureDataDirectory
      }
    }
    return fallback;
  }

  onModuleInit() {
    this.ensureDataDirectory();
    this.loadData();
    this.logger.log(`Initialized Demo JSON Storage from: ${this.dataDir}`);
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.usersFile)) {
      fs.writeFileSync(this.usersFile, JSON.stringify([]));
    }
    if (!fs.existsSync(this.productsFile)) {
      fs.writeFileSync(this.productsFile, JSON.stringify([]));
    }
    if (!fs.existsSync(this.ordersFile)) {
      fs.writeFileSync(this.ordersFile, JSON.stringify([]));
    }
    if (!fs.existsSync(this.promosFile)) {
      fs.writeFileSync(this.promosFile, JSON.stringify([]));
    }
  }

  private loadData() {
    try {
      if (fs.existsSync(this.usersFile)) {
        this.users = JSON.parse(
          fs.readFileSync(this.usersFile, 'utf8'),
        ) as User[];
      }
      if (!this.users || this.users.length === 0) {
        // Seed default demo accounts with demonstration bcrypt hash
        this.users = [
          {
            id: 'vzq41mu',
            email: 'isha@gmail.com',
            name: 'Isha Dubey',
            role: 'admin',
            passwordHash: '$2b$10$5lUqfx3UF41/8iedwBA2SuDv1mjFt.3uVETHdDK58.dSVapaCvpnK',
            addresses: [],
            wishlist: [],
          },
          {
            id: 'vzq41mu-legacy',
            email: 'isha@gmailcom',
            name: 'Isha Dubey',
            role: 'admin',
            passwordHash: '$2b$10$5lUqfx3UF41/8iedwBA2SuDv1mjFt.3uVETHdDK58.dSVapaCvpnK',
            addresses: [],
            wishlist: [],
          },
          {
            id: 'aw9027u',
            email: 'gauravbhoria07@gmail.com',
            name: 'Gaurav Bhoria',
            role: 'admin',
            passwordHash: '$2b$10$5lUqfx3UF41/8iedwBA2SuDv1mjFt.3uVETHdDK58.dSVapaCvpnK',
            addresses: ['#210 sec-29, Chandigarh'],
            phone: '',
            wishlist: [],
          },
          {
            id: 'hoxg8i9',
            email: 'admin_fix@omnimart.com',
            name: 'Admin Fixer',
            role: 'admin',
            passwordHash: '$2b$10$5lUqfx3UF41/8iedwBA2SuDv1mjFt.3uVETHdDK58.dSVapaCvpnK',
            addresses: [],
            wishlist: [],
          },
          {
            id: '9f82c153-4ec9-4592-a74f-52a6fdbe7888',
            email: 'disha@gmail.com',
            name: 'disha',
            role: 'user',
            passwordHash: '$2b$10$5lUqfx3UF41/8iedwBA2SuDv1mjFt.3uVETHdDK58.dSVapaCvpnK',
            addresses: ['aszdxfcgvyhujiokdfgvhjkl'],
            wishlist: [],
          },
        ];
        this.saveUsers();
      }
      if (fs.existsSync(this.productsFile)) {
        const loaded = JSON.parse(
          fs.readFileSync(this.productsFile, 'utf8'),
        ) as Product[];
        this.products = loaded.map((p) => ({
          ...p,
          stockQuantity:
            p.stockQuantity !== undefined ? p.stockQuantity : 50,
        }));
      }
      if (fs.existsSync(this.ordersFile)) {
        this.orders = JSON.parse(
          fs.readFileSync(this.ordersFile, 'utf8'),
        ) as Order[];
      }
      if (fs.existsSync(this.promosFile)) {
        this.promos = JSON.parse(
          fs.readFileSync(this.promosFile, 'utf8'),
        ) as PromoCode[];
      }
    } catch (e) {
      this.logger.error('Error loading JSON data files:', e);
    }
  }

  private safeWriteJson(filePath: string, data: unknown) {
    const tmpFile = `${filePath}.tmp`;
    try {
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tmpFile, filePath);
    } catch (err) {
      this.logger.warn(
        `Failed atomic write for ${filePath}, using direct write:`,
        err,
      );
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    }
  }

  private saveUsers() {
    this.safeWriteJson(this.usersFile, this.users);
  }

  private saveProducts() {
    this.safeWriteJson(this.productsFile, this.products);
  }

  private saveOrders() {
    this.safeWriteJson(this.ordersFile, this.orders);
  }

  private savePromos() {
    this.safeWriteJson(this.promosFile, this.promos);
  }

  // ================= USERS API =================

  async getUsers(): Promise<User[]> {
    this.loadData();
    return this.users;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    this.loadData();
    const searchEmail = email.toLowerCase().trim();
    return this.users.find((u) => {
      const userEmail = u.email.toLowerCase().trim();
      if (userEmail === searchEmail) return true;
      // Seamlessly support legacy domain typo and dot variations
      if (
        (searchEmail === 'isha@gmail.com' && userEmail === 'isha@gmailcom') ||
        (searchEmail === 'isha@gmailcom' && userEmail === 'isha@gmail.com')
      ) {
        return true;
      }
      return false;
    });
  }

  async getUserById(id: string): Promise<User | undefined> {
    this.loadData();
    return this.users.find((u) => u.id === id);
  }

  async createUser(user: Omit<User, 'id' | 'addresses'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: randomUUID(),
      addresses: [],
      wishlist: [],
    };
    this.users.push(newUser);
    this.saveUsers();
    return newUser;
  }

  async addUserAddress(
    userId: string,
    address: string,
  ): Promise<User | undefined> {
    this.loadData();
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      if (!user.addresses.includes(address)) {
        user.addresses.push(address);
        this.saveUsers();
      }
      return user;
    }
    return undefined;
  }

  async updateUser(
    id: string,
    updates: Partial<
      Pick<User, 'name' | 'phone' | 'addresses' | 'wishlist' | 'role'>
    >,
  ): Promise<User | undefined> {
    this.loadData();
    const user = this.users.find((u) => u.id === id);
    if (user) {
      if (updates.name !== undefined) user.name = updates.name;
      if (updates.phone !== undefined) user.phone = updates.phone;
      if (updates.addresses !== undefined) user.addresses = updates.addresses;
      if (updates.wishlist !== undefined) user.wishlist = updates.wishlist;
      if (updates.role !== undefined) user.role = updates.role;
      this.saveUsers();
      return user;
    }
    return undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    this.loadData();
    const initialLength = this.users.length;
    this.users = this.users.filter((u) => u.id !== id);
    if (this.users.length !== initialLength) {
      this.saveUsers();
      return true;
    }
    return false;
  }

  // ================= PRODUCTS API =================

  async getProducts(): Promise<Product[]> {
    this.loadData();
    return this.products;
  }

  async getProductById(id: string): Promise<Product | undefined> {
    this.loadData();
    return this.products.find((p) => p.id === id);
  }

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: randomUUID(),
      reviews: [],
      stockQuantity:
        product.stockQuantity !== undefined ? product.stockQuantity : 50,
    };
    this.products.push(newProduct);
    this.saveProducts();
    return newProduct;
  }

  async updateProduct(
    id: string,
    updates: Partial<Omit<Product, 'id'>>,
  ): Promise<Product | undefined> {
    this.loadData();
    const product = this.products.find((p) => p.id === id);
    if (product) {
      Object.assign(product, updates);
      this.saveProducts();
      return product;
    }
    return undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    this.loadData();
    const index = this.products.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.products.splice(index, 1);
      this.saveProducts();
      return true;
    }
    return false;
  }

  async addProductReview(
    productId: string,
    review: ProductReview,
  ): Promise<Product | undefined> {
    this.loadData();
    const product = this.products.find((p) => p.id === productId);
    if (product) {
      if (!product.reviews) {
        product.reviews = [];
      }
      product.reviews.push(review);
      this.saveProducts();
      return product;
    }
    return undefined;
  }

  // ================= ORDERS API =================

  async getOrders(): Promise<Order[]> {
    this.loadData();
    return this.orders;
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    this.loadData();
    return this.orders.filter((o) => o.userId === userId);
  }

  async createOrder(
    order: Omit<Order, 'id' | 'status' | 'createdAt' | 'statusHistory'>,
  ): Promise<Order> {
    const orderId =
      'ORD-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const now = new Date().toISOString();

    const newOrder: Order = {
      ...order,
      id: orderId,
      status: 'pending',
      statusHistory: [{ status: 'pending', timestamp: now }],
      createdAt: now,
    };
    this.orders.push(newOrder);
    this.saveOrders();
    return newOrder;
  }

  async updateOrderStatus(
    id: string,
    status: Order['status'],
  ): Promise<Order | undefined> {
    this.loadData();
    const order = this.orders.find((o) => o.id === id);
    if (order) {
      order.status = status;
      if (!order.statusHistory) {
        order.statusHistory = [
          {
            status: 'pending',
            timestamp: order.createdAt || new Date().toISOString(),
          },
        ];
      }
      order.statusHistory.push({
        status,
        timestamp: new Date().toISOString(),
      });
      this.saveOrders();
      return order;
    }
    return undefined;
  }

  // ================= PROMO CODES API =================

  async getPromos(): Promise<PromoCode[]> {
    this.loadData();
    return this.promos;
  }

  async getPromoByCode(code: string): Promise<PromoCode | undefined> {
    this.loadData();
    return this.promos.find(
      (p) => p.code.toUpperCase() === code.toUpperCase() && p.isActive,
    );
  }

  async createPromo(promo: Omit<PromoCode, 'createdAt'>): Promise<PromoCode> {
    this.loadData();
    const newPromo: PromoCode = {
      ...promo,
      code: promo.code.toUpperCase(),
      createdAt: new Date().toISOString(),
    };
    const existingIndex = this.promos.findIndex(
      (p) => p.code === newPromo.code,
    );
    if (existingIndex >= 0) {
      this.promos[existingIndex] = newPromo;
    } else {
      this.promos.push(newPromo);
    }
    this.savePromos();
    return newPromo;
  }

  async deletePromo(code: string): Promise<boolean> {
    this.loadData();
    const index = this.promos.findIndex((p) => p.code === code.toUpperCase());
    if (index !== -1) {
      this.promos.splice(index, 1);
      this.savePromos();
      return true;
    }
    return false;
  }
}
