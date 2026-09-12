import {
	IsEmail,
	IsString,
	IsOptional,
	Length,
	Matches,
	MaxLength,
} from 'class-validator';

export class CreateCustomerDto {
	@IsString()
	name: string;

	@IsString()
	customerType: string;

	@IsOptional()
	@IsEmail({}, { message: 'Email must be a valid email address' })
	@MaxLength(50, { message: 'Email must be 50 characters or fewer' })
	email?: string | null;

	@IsOptional()
	@IsString()
	notes: string;

	@IsOptional()
	@IsString()
	@Length(11, 11, { message: 'Phone number must be exactly 11 digits' })
	@Matches(/^[0-9]+$/, { message: 'Phone number must contain only digits' })
	phone?: string | null;
}
