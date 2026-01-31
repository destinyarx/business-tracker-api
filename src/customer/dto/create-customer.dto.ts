import { IsEmail, IsEnum, IsString, IsOptional, Length, Matches } from 'class-validator';

enum Gender {
    Male = 'M',
    Female = 'F',
    Unknown = 'X'
}

export class CreateCustomerDto {
    @IsString()
    name: string

    @IsOptional()
    @IsEnum(Gender, {
        message: 'gender must be either M or F',
    })
    gender: Gender

    @IsString()
    customerType: string

    // @IsOptional()
    // @IsEnum(Status, {
    //     message: 'status must be either A (Active) or I (Inactive)',
    // })
    // status: Status;

    @IsOptional()
    @IsEmail()
    email: string

    @IsOptional()
    @IsString()
    notes: string

    @IsOptional()
    @IsString()
    @Length(11, 11, { message: 'Phone number must be exactly 11 digits' })
    @Matches(/^[0-9]+$/, { message: 'Phone number must contain only digits' })
    phone: string
}