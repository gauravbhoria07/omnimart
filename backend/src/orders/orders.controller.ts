import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreatePromoDto } from './dto/create-promo.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Roles('user', 'admin')
  @Post()
  async create(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(
      req.user.id,
      dto.items,
      dto.address,
      dto.promoCode,
    );
  }

  @Roles('user', 'admin')
  @Get()
  async findAll(@Request() req: any) {
    return this.ordersService.findAll(req.user);
  }

  @Roles('admin')
  @Get('analytics')
  async getAnalytics() {
    return this.ordersService.getAnalytics();
  }

  @Roles('admin')
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.ordersService.updateStatus(id, status);
  }

  @Roles('user', 'admin')
  @Patch(':id/cancel')
  async cancelOrder(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.cancelOrder(id, req.user.id);
  }

  // Promo Code Endpoints
  @Roles('admin')
  @Get('promo')
  async getPromos() {
    return this.ordersService.getPromos();
  }

  @Roles('admin')
  @Post('promo')
  async createPromo(@Body() dto: CreatePromoDto) {
    return this.ordersService.createPromo(
      dto.code,
      dto.discountPercentage,
      dto.isActive !== undefined ? dto.isActive : true,
    );
  }

  @Roles('admin')
  @Delete('promo/:code')
  async deletePromo(@Param('code') code: string) {
    return this.ordersService.deletePromo(code);
  }

  @Roles('user', 'admin')
  @Get('promo/validate/:code')
  async validatePromo(@Param('code') code: string) {
    return this.ordersService.validatePromo(code);
  }
}
