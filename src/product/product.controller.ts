import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { UserCacheInterceptor } from '../common/interceptors/user-cache.interceptor'
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
  @UseInterceptors(UserCacheInterceptor)
  findAll(@UserId() userId: string) {
    return this.productService.findAll(userId);
  }

  @Get(':id')
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
  remove(
    @UserId() userId: string,
    @Param('id') id: string
  ) {
    return this.productService.remove(+id, userId);
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
