import { CategoryType } from '../../entities';

export interface DefaultSubcategorySeed { name: string; }
export interface DefaultCategorySeed {
  name: string; type: CategoryType; icon: string; color: string; subcategories: DefaultSubcategorySeed[];
}

export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  { name: 'Income', type: CategoryType.INCOME, icon: 'payments', color: '#2e7d32', subcategories: [
    { name: 'Salary' }, { name: 'Freelancing' }, { name: 'Bonus' }, { name: 'Investment' },
    { name: 'Rental Income' }, { name: 'Gift' }, { name: 'Refund' }, { name: 'Other Income' } ] },
  { name: 'Food', type: CategoryType.EXPENSE, icon: 'restaurant', color: '#ef6c00', subcategories: [
    { name: 'Groceries' }, { name: 'Restaurant' }, { name: 'Fast Food' }, { name: 'Coffee' }, { name: 'Snacks' } ] },
  { name: 'Transport', type: CategoryType.EXPENSE, icon: 'directions_car', color: '#1565c0', subcategories: [
    { name: 'Fuel' }, { name: 'Taxi' }, { name: 'Bus' }, { name: 'Metro' }, { name: 'Parking' }, { name: 'Maintenance' } ] },
  { name: 'Home', type: CategoryType.EXPENSE, icon: 'home', color: '#6a1b9a', subcategories: [
    { name: 'Rent' }, { name: 'Electricity' }, { name: 'Water' }, { name: 'Gas' }, { name: 'Internet' }, { name: 'Furniture' }, { name: 'Repairs' } ] },
  { name: 'Shopping', type: CategoryType.EXPENSE, icon: 'shopping_bag', color: '#ad1457', subcategories: [
    { name: 'Clothing' }, { name: 'Shoes' }, { name: 'Electronics' }, { name: 'Accessories' } ] },
  { name: 'Health', type: CategoryType.EXPENSE, icon: 'favorite', color: '#c62828', subcategories: [
    { name: 'Medicine' }, { name: 'Doctor' }, { name: 'Dental' }, { name: 'Gym' }, { name: 'Insurance' } ] },
  { name: 'Entertainment', type: CategoryType.EXPENSE, icon: 'movie', color: '#4527a0', subcategories: [
    { name: 'Movies' }, { name: 'Games' }, { name: 'Streaming' }, { name: 'Travel' }, { name: 'Events' } ] },
  { name: 'Education', type: CategoryType.EXPENSE, icon: 'school', color: '#00838f', subcategories: [
    { name: 'Books' }, { name: 'Courses' }, { name: 'Tuition' } ] },
  { name: 'Family', type: CategoryType.EXPENSE, icon: 'family_restroom', color: '#558b2f', subcategories: [
    { name: 'Kids' }, { name: 'Parents' }, { name: 'Gifts' } ] },
  { name: 'Bills', type: CategoryType.EXPENSE, icon: 'receipt_long', color: '#bf360c', subcategories: [
    { name: 'Mobile' }, { name: 'Credit Card' }, { name: 'Loans' } ] },
  { name: 'Savings', type: CategoryType.EXPENSE, icon: 'savings', color: '#283593', subcategories: [
    { name: 'Emergency Fund' }, { name: 'Investment' }, { name: 'Retirement' } ] },
  { name: 'Other', type: CategoryType.EXPENSE, icon: 'category', color: '#616161', subcategories: [
    { name: 'Miscellaneous' } ] },
];
