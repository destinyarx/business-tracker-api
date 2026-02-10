import { IsIn, IsString, IsArray, ValidateNested, IsNumber, IsDefined, IsObject } from 'class-validator'
import { Type } from 'class-transformer'

class ProductDto {
  @IsNumber()
  id: number;

  @IsString()
  title: string;

  @IsNumber()
  price: number;
}

export class ItemDto {
  @IsString()
  priceAtPurchase: string;

  @IsNumber()
  quantity: number;

  @IsString()
  subtotal: string;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => ProductDto)
  product: ProductDto;
}


export class UpdateOrderStatusDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  orderItems: ItemDto[];

  @IsString()
  @IsIn(['pending', 'in_progress', 'completed', 'cancelled'])
  status: string
}