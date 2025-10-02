import { IsEmail, IsString } from 'class-validator';

export class CreateUserDto {
    @IsString()
    clerkId: string;

    @IsString()
    username: string;

    @IsEmail()
    email: string;
    
    @IsString()
    name: string;
    
    @IsString()
    contactNumber: string;

    @IsString()
    status: string;
}
