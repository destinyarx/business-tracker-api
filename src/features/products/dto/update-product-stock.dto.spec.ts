import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProductStockDto } from './update-product-stock.dto';

describe('UpdateProductStockDto', () => {
	it.each([0, 12])('accepts stock value %s', async (stock) => {
		const dto = plainToInstance(UpdateProductStockDto, { stock });

		await expect(validate(dto)).resolves.toHaveLength(0);
	});

	it.each([-1, 1.5])('rejects stock value %s', async (stock) => {
		const dto = plainToInstance(UpdateProductStockDto, { stock });

		expect(await validate(dto)).not.toHaveLength(0);
	});
});
