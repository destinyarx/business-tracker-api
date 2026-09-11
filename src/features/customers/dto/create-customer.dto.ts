import {
	IsEmail,
	IsString,
	IsOptional,
	Length,
	Matches,
} from 'class-validator';

export class CreateCustomerDto {
	@IsString()
	name: string;

	@IsString()
	customerType: string;

	@IsOptional()
	@IsEmail({}, { message: 'Email must be a valid email address' })
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
