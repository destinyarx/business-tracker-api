import { Injectable,BadRequestException, Inject } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { getAllProducts, getProduct, addProduct, updateProduct, deleteProduct, getProductsPaginated } from '../db/queries/products.queries'

@Injectable()
export class ProductService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createProductDto: CreateProductDto, userId: string) {
    try {
      const insertedId = await addProduct(createProductDto, userId);
      await this.cacheManager.del(`${userId}:/products`)
      return insertedId
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurs';
      throw new BadRequestException(message);
    }
  }

  async findAll(userId: string) {
    try {
      console.log('AYOWN gumana')
      return await getAllProducts(userId)
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

  async update(id: number, updateProductDto: UpdateProductDto, userId: string) {
    try {
      const update = await updateProduct(id, updateProductDto, userId)
      await this.cacheManager.del(`${userId}:/products`)
      return update
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurs'
      throw new BadRequestException(message)
    }
  }

  async remove(id: number, userId: string) {
    try {
      const deleted = await deleteProduct(id);
      await this.cacheManager.del(`${userId}:/products`)
      return deleted
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Product does not exist'
      throw new BadRequestException(message);
    }
  }

  async findPaginated(limit: number, offset: number, searchTerm: string|null, filter: string|null) {
    try {
      return await getProductsPaginated(limit, offset, searchTerm, filter)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurs'
      throw new BadRequestException(message)
    }
  }
}
