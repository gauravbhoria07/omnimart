import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AddReviewDto } from './dto/add-review.dto';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('ids') ids?: string,
  ) {
    return this.productsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      category,
      search,
      sort,
      ids,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(
      dto.name,
      dto.description,
      dto.price,
      dto.image,
      dto.category,
      dto.stockQuantity,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(
      id,
      dto.name,
      dto.description,
      dto.price,
      dto.image,
      dto.category,
      dto.stockQuantity,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.productsService.delete(id);
    return { success: true, message: 'Product deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reviews')
  async addReview(
    @Param('id') id: string,
    @Body() dto: AddReviewDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userName = req.user.name;
    return this.productsService.addReview(
      id,
      userId,
      userName,
      dto.rating,
      dto.comment,
    );
  }
}
