import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { getAll, getUser, addUser, updateUser, deleteUser, findUsersPaginated } from '../db/queries/users.queries'

@Injectable()
export class UserService {
  async create(createUserDto: CreateUserDto) {
    try {
      return await addUser(createUserDto);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
  }

  async findAll() {
    try {
      return await getAll();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
  }

  async findOne(id: string) {
    try {
      return await getUser(id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const data = Object.fromEntries(
      Object.entries(updateUserDto).filter(([_, value]) => value !== undefined),
    );

    try {
      return await updateUser(id, data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
  }

  async remove(id: string) {
    try {
      return await deleteUser(id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
  }

  async findUsersPaginated(limit: number, offset: number) {
    try {
      return await findUsersPaginated(limit, offset)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
  }
}
