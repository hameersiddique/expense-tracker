import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, Transaction } from '../../entities';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account) private accountsRepository: Repository<Account>,
    @InjectRepository(Transaction) private transactionsRepository: Repository<Transaction>,
  ) {}

  findAll(userId: string, includeArchived = false): Promise<Account[]> {
    const where: Record<string, unknown> = { userId };
    if (!includeArchived) where.isArchived = false;
    return this.accountsRepository.find({ where, order: { createdAt: 'ASC' } });
  }

  async findOne(userId: string, id: string): Promise<Account> {
    const account = await this.accountsRepository.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
    if (account.userId !== userId) throw new ForbiddenException('Access denied');
    return account;
  }

  async create(userId: string, dto: CreateAccountDto): Promise<Account> {
    if (dto.isDefault) await this.accountsRepository.update({ userId }, { isDefault: false });
    const account = this.accountsRepository.create({
      userId, name: dto.name, initialBalance: String(dto.initialBalance ?? 0), currency: dto.currency ?? 'USD', isDefault: dto.isDefault ?? false,
    });
    return this.accountsRepository.save(account);
  }

  async update(userId: string, id: string, dto: UpdateAccountDto): Promise<Account> {
    const account = await this.findOne(userId, id);
    if (dto.isDefault) await this.accountsRepository.update({ userId }, { isDefault: false });
    Object.assign(account, { ...dto, initialBalance: dto.initialBalance !== undefined ? String(dto.initialBalance) : account.initialBalance });
    return this.accountsRepository.save(account);
  }

  async archive(userId: string, id: string): Promise<Account> {
    const account = await this.findOne(userId, id);
    account.isArchived = true;
    return this.accountsRepository.save(account);
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    const account = await this.findOne(userId, id);
    const usageCount = await this.transactionsRepository.count({ where: { accountId: id } });
    if (usageCount > 0) throw new BadRequestException(`Cannot delete an account used by ${usageCount} transaction(s).`);
    await this.accountsRepository.remove(account);
    return { message: 'Account deleted' };
  }
}
