import 'reflect-metadata';
import { validateSync } from 'class-validator';
import { CreateCustomerDto } from './create-customer.dto';
import { UpdateCustomerDto } from './update-customer.dto';

const validCustomer = {
	name: 'Sample Customer',
	customerType: 'normal',
};

describe('Customer DTO validation', () => {
	it.each([undefined, null, '09123456789'])(
		'accepts optional or valid phone value %p',
		(phone) => {
			const customer = Object.assign(new CreateCustomerDto(), {
				...validCustomer,
				phone,
			});

			expect(validateSync(customer)).toHaveLength(0);
		},
	);

	it.each(['', '9123456789', '091234567890', '09123abc789', 91234567890])(
		'rejects invalid phone value %p',
		(phone) => {
			const customer = Object.assign(new CreateCustomerDto(), {
				...validCustomer,
				phone,
			});

			expect(validateSync(customer).some((error) => error.property === 'phone')).toBe(true);
		},
	);

	it.each([undefined, null, 'customer@example.com'])(
		'accepts optional or valid email value %p',
		(email) => {
			const customer = Object.assign(new CreateCustomerDto(), {
				...validCustomer,
				email,
			});

			expect(validateSync(customer)).toHaveLength(0);
		},
	);

	it.each(['', 'invalid-email', 'customer@'])(
		'rejects invalid email value %p',
		(email) => {
			const customer = Object.assign(new CreateCustomerDto(), {
				...validCustomer,
				email,
			});

			expect(validateSync(customer).some((error) => error.property === 'email')).toBe(true);
		},
	);

	it('applies the nullable contact rules to updates', () => {
		const validUpdate = Object.assign(new UpdateCustomerDto(), {
			phone: null,
			email: null,
		});
		const invalidUpdate = Object.assign(new UpdateCustomerDto(), {
			phone: '123',
			email: 'invalid-email',
		});

		expect(validateSync(validUpdate)).toHaveLength(0);
		expect(validateSync(invalidUpdate).map((error) => error.property)).toEqual([
			'email',
			'phone',
		]);
	});
});
