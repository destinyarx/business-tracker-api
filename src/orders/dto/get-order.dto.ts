import { IsInt, IsString, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'


export class GetOrderDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    offset?: number

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    limit?: number

    @IsOptional()
    @IsString()
    filter?: string

    @IsOptional()
    @IsString()
    searchKey?: string

    @IsOptional()
    @IsString()
    timePeriod?: string
}