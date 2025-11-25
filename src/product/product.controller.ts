import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UserId } from '../common/decorators/user-id.decorator'

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(
    @UserId() userId: string, 
    @Body() createProductDto: CreateProductDto
  ) {
    return this.productService.create(createProductDto, userId);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  findAll(@UserId() userId: string) {
    return this.productService.findAll(userId);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  findOne(
    @UserId() userId: string,
    @Param('id') id: string
  ) {
    return this.productService.findOne(+id);
  }

  @Patch(':id')
  update(
    @UserId() userId: string,
    @Param('id') id: string, 
    @Body() updateProductDto: UpdateProductDto
  ) {
    return this.productService.update(+id, updateProductDto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }

  @Get('paginated')
  findPaginated(
    @Query('limit', ParseIntPipe) limit: number,
    @Query('offset', ParseIntPipe) offset: number,
  ) {
    return 'PRODUCTS'
    // return this.productService.findPaginated(limit, offset);
  }
}
