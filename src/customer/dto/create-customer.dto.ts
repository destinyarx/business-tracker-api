import { IsEmail, IsEnum, IsString, Length, Matches } from 'class-validator';

enum Gender {
    Male = 'M',
    Female = 'F',
    Unknown = 'X'
}

enum Status {
    Active = 'A',
    Inactive = 'I'
}

export class CreateCustomerDto {
    @IsString()
    alias: string;

    @IsString()
    fullName: string;

    @IsString()
    firstName: string;

    @IsString()
    middleName: string;

    @IsString()
    lastName: string;

    @IsEnum(Gender, {
        message: 'gender must be either M or F',
    })
    gender: Gender;

    @IsEnum(Status, {
        message: 'status must be either A (Active) or I (Inactive)',
    })
    status: Status;

    @IsEmail()
    email: string;

    @IsString()
    createdBy: string;

    @IsString()
    @Length(11, 11, { message: 'Phone number must be exactly 11 digits' })
    @Matches(/^[0-9]+$/, { message: 'Phone number must contain only digits' })
    contactNumber: string;
}