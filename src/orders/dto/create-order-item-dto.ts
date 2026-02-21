import { IsNumber, IsPositive, IsOptional } from 'class-validator';

export class CreateOrderItemDto {
  @IsNumber()
  id: number;

  @IsPositive()
  @IsNumber()
  quantity: number;

  @IsPositive()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  profit: number;
}