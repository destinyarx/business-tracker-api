import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionService {
	create(createTransactionDto: CreateTransactionDto) {
		void createTransactionDto;
		return 'This action adds a new transaction';
	}

	findAll() {
		return `This action returns all transaction`;
	}

	findOne(id: number) {
		return `This action returns a #${id} transaction`;
	}

	update(id: number, updateTransactionDto: UpdateTransactionDto) {
		void updateTransactionDto;
		return `This action updates a #${id} transaction`;
	}

	remove(id: number) {
		return `This action removes a #${id} transaction`;
	}
}
