import { IsEnum, IsString, IsNumber, IsOptional } from 'class-validator';
import { ProductCategory } from 'src/common/constants'

export class CreateProductDto {
    @IsString()
    title: string

    @IsOptional()
    @IsString()
    description: string

    @IsEnum(ProductCategory, {
        message: 'Category not found.'
    })
    category: ProductCategory

    @IsOptional()
    @IsString()
    sku: string

    @IsOptional()
    @IsString()
    supplier: string

    @IsOptional()
    @IsString()
    barcode: string

    @IsNumber()
    price: number

    @IsOptional()
    @IsNumber()
    profit: number

    @IsNumber()
    stock: number

    @IsOptional()
    @IsString()
    image: string

    @IsOptional()
    @IsString()
    imageUrl: string
}
