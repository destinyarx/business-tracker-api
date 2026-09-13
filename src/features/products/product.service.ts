import {
	Injectable,
	BadRequestException,
	Inject,
	NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductStockDto } from './dto/update-product-stock.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import {
	getAllProducts,
	getProduct,
	addProduct,
	updateProduct,
	deleteProduct,
	getProductsPaginated,
	updateProductStock,
} from '../../infrastructure/database/queries/products.queries';
import { SalesCacheService } from '../sales/sales-cache.service';

@Injectable()
export class ProductService {
	constructor(
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
		private readonly salesCache: SalesCacheService,
	) {}

	async create(createProductDto: CreateProductDto, userId: string) {
		try {
			const insertedId = await addProduct(createProductDto, userId);
			await this.cacheManager.del(`${userId}:/products`);
			return insertedId;
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: 'Unexpected error occurs';
			throw new BadRequestException(message);
		}
	}

	async findAll(userId: string) {
		try {
			return await getAllProducts(userId);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: 'Unexpected error occurs';
			throw new BadRequestException(message);
		}
	}

	async findOne(id: number) {
		try {
			return await getProduct(id);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: 'Unexpected error occurs';
			throw new BadRequestException(message);
		}
	}

	async update(
		id: number,
		updateProductDto: UpdateProductDto,
		userId: string,
	) {
		try {
			const update = await updateProduct(id, updateProductDto, userId);
			await this.cacheManager.del(`${userId}:/products`);
			if (update.length > 0 && updateProductDto.title !== undefined) {
				await this.salesCache.rotate(userId);
			}
			return update;
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: 'Unexpected error occurs';
			throw new BadRequestException(message);
		}
	}

	async updateStock(
		id: number,
		updateProductStockDto: UpdateProductStockDto,
		userId: string,
	) {
		let updatedProduct: { id: number; stock: number | null } | undefined;

		try {
			updatedProduct = await updateProductStock(
				id,
				updateProductStockDto.stock,
				userId,
			);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: 'Unexpected error occurs';
			throw new BadRequestException(message);
		}

		if (!updatedProduct) throw new NotFoundException('Product not found');

		await this.cacheManager.del(`${userId}:/products`);
		return updatedProduct;
	}

	async remove(id: number, userId: string) {
		try {
			const deleted = await deleteProduct(id, userId);
			await this.cacheManager.del(`${userId}:/products`);
			if (deleted.length > 0) await this.salesCache.rotate(userId);
			return deleted;
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: 'Product does not exist';
			throw new BadRequestException(message);
		}
	}

	async findPaginated(
		limit: number,
		offset: number,
		searchTerm: string | null,
		filter: string | null,
	) {
		try {
			return await getProductsPaginated(
				limit,
				offset,
				searchTerm,
				filter,
			);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: 'Unexpected error occurs';
			throw new BadRequestException(message);
		}
	}
}
