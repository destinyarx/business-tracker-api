import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomerService {
    findAll() {
        return [
            { id: 1, name: 'John Doe' },
            { id: 2, name: 'Jane Smith' },
        ];
    }

    create(customerData: any) {
        return {
            message: 'successful',
            data: customerData
        }
    }
}

