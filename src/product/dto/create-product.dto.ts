import { IsEnum, IsString, IsNumber } from 'class-validator';
 
enum ProductCategory {
    FOOD = "Food",
    BEVERAGES = "Beverages",
    GROCERY = "Grocery",
    ELECTRONICS = "Electronics",
    CLOTHING = "Clothing",
    HEALTH_BEAUTY = "Health & Beauty",
    HOME_APPLIANCES = "Home Appliances",
    FURNITURE = "Furniture",
    TOYS = "Toys",
    STATIONERY = "Stationery",
    HARDWARE = "Hardware",
    AUTOMOTIVE = "Automotive",
    SERVICES = "Services",
}
  
export class CreateProductDto {
    @IsString()
    name: string

    @IsString()
    description: string

    @IsEnum(ProductCategory, {
        message: 'Category not found.'
    })
    category: ProductCategory

    @IsString()
    sku: string

    @IsString()
    barcode: string

    @IsNumber()
    basePrice: number

    @IsNumber()
    costPrice: number

    @IsNumber()
    stock: number

    @IsString()
    image: string

    @IsString()
    createdBy: string
}
