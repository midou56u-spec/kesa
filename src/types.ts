export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}
