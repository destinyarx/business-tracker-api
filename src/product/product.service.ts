import { Injectable,BadRequestException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { getAllProducts, getProduct, addProduct, updateProduct, deleteProduct, getProductsPaginated } from '../db/queries/products.queries'

@Injectable()
export class ProductService {
  create(createProductDto: CreateProductDto) {
    try {
      return addProduct(createProductDto);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurs';
      throw new BadRequestException(message);
    }
  }

  async findAll() {
    try {
      return await getAllProducts()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurs';
      throw new BadRequestException(message);
    }
  }

  async findOne(id: number) {
    try {
      return await getProduct(id)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurs';
      throw new BadRequestException(message);
    }
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    try {
      return await updateProduct(id, updateProductDto);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurs';
      throw new BadRequestException(message);
    }
  }

  async remove(id: number) {
    try {
      return await deleteProduct(id);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Product does not exist';
      throw new BadRequestException(message);
    }
  }

  async findPaginated(limit: number, offset: number, searchTerm: string|null, filter: string|null) {
    try {
      return await getProductsPaginated(limit, offset, searchTerm, filter)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurs';
      throw new BadRequestException(message);
    }
  }
}
