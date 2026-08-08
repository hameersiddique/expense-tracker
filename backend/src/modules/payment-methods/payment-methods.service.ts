import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod, Transaction } from '../../entities';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectRepository(PaymentMethod) private paymentMethodsRepository: Repository<PaymentMethod>,
    @InjectRepository(Transaction) private transactionsRepository: Repository<Transaction>,
  ) {}

  findAll(userId: string, includeArchived = false): Promise<PaymentMethod[]> {
    const where: Record<string, unknown> = { userId };
    if (!includeArchived) where.isArchived = false;
    return this.paymentMethodsRepository.find({ where, order: { createdAt: 'ASC' } });
  }

  async findOne(userId: string, id: string): Promise<PaymentMethod> {
    const method = await this.paymentMethodsRepository.findOne({ where: { id } });
    if (!method) throw new NotFoundException('Payment method not found');
    if (method.userId !== userId) throw new ForbiddenException('Access denied');
    return method;
  }

  async create(userId: string, dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    const method = this.paymentMethodsRepository.create({ userId, ...dto });
    return this.paymentMethodsRepository.save(method);
  }

  async update(userId: string, id: string, dto: UpdatePaymentMethodDto): Promise<PaymentMethod> {
    const method = await this.findOne(userId, id);
    Object.assign(method, dto);
    return this.paymentMethodsRepository.save(method);
  }

  async archive(userId: string, id: string): Promise<PaymentMethod> {
    const method = await this.findOne(userId, id);
    method.isArchived = true;
    return this.paymentMethodsRepository.save(method);
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    const method = await this.findOne(userId, id);
    const usageCount = await this.transactionsRepository.count({ where: { paymentMethodId: id } });
    if (usageCount > 0) throw new BadRequestException(`Cannot delete a payment method used by ${usageCount} transaction(s).`);
    await this.paymentMethodsRepository.remove(method);
    return { message: 'Payment method deleted' };
  }
}
