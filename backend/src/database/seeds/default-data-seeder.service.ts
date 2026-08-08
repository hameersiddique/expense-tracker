import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Category, Subcategory, PaymentMethod, PaymentMethodType, Account } from '../../entities';
import { DEFAULT_CATEGORIES } from './default-categories.seed';

@Injectable()
export class DefaultDataSeederService {
  constructor(private dataSource: DataSource) {}

  async seedForUser(userId: string, manager?: EntityManager): Promise<void> {
    const runner = manager ?? this.dataSource.manager;
    await this.seedCategories(userId, runner);
    await this.seedPaymentMethods(userId, runner);
    await this.seedDefaultAccount(userId, runner);
  }

  private async seedCategories(userId: string, manager: EntityManager): Promise<void> {
    const categoryRepo = manager.getRepository(Category);
    const subcategoryRepo = manager.getRepository(Subcategory);
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const seed = DEFAULT_CATEGORIES[i];
      const category = await categoryRepo.save(categoryRepo.create({
        userId, name: seed.name, type: seed.type, icon: seed.icon, color: seed.color, isDefault: true, sortOrder: i,
      }));
      const subcategories = seed.subcategories.map((sub, idx) => subcategoryRepo.create({
        userId, categoryId: category.id, name: sub.name, isDefault: true, sortOrder: idx,
      }));
      await subcategoryRepo.save(subcategories);
    }
  }

  private async seedPaymentMethods(userId: string, manager: EntityManager): Promise<void> {
    const paymentMethodRepo = manager.getRepository(PaymentMethod);
    const defaults: { type: PaymentMethodType; name: string; isDefault: boolean }[] = [
      { type: PaymentMethodType.CASH, name: 'Cash', isDefault: true },
      { type: PaymentMethodType.BANK, name: 'Bank Transfer', isDefault: false },
      { type: PaymentMethodType.CREDIT_CARD, name: 'Credit Card', isDefault: false },
      { type: PaymentMethodType.DEBIT_CARD, name: 'Debit Card', isDefault: false },
      { type: PaymentMethodType.WALLET, name: 'Digital Wallet', isDefault: false },
      { type: PaymentMethodType.OTHER, name: 'Other', isDefault: false },
    ];
    const entities = defaults.map((d) => paymentMethodRepo.create({ userId, ...d }));
    await paymentMethodRepo.save(entities);
  }

  private async seedDefaultAccount(userId: string, manager: EntityManager): Promise<void> {
    const accountRepo = manager.getRepository(Account);
    await accountRepo.save(accountRepo.create({
      userId, name: 'Main Account', initialBalance: '0', currency: 'USD', isDefault: true,
    }));
  }
}
