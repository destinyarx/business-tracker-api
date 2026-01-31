import { IsNumber, IsPositive } from 'class-validator';

export class CreateOrderItemDto {
  @IsNumber()
  productId: number;

  @IsPositive()
  quantity: number;

  @IsPositive()
  price: number;
}