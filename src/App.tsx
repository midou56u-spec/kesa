import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Wallet, PieChart, History, PlusCircle, ArrowDownLeft, Search, Filter, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

import { Expense, Category } from './types';

const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Math.random().toString(36).substring(2, 15);
  }
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'أكل وشرب' },
  { id: '2', name: 'مواصلات' },
  { id: '3', name: 'إيجار' },
  { id: '4', name: 'فواتير' },
  { id: '5', name: 'ترفيه' },
  { id: '6', name: 'صحة' },
];

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  const [payday, setPayday] = useState<number>(() => {
    const saved = localStorage.getItem('payday');
    return saved ? parseInt(saved) : 1;
  });

  useEffect(() => {
    localStorage.setItem('payday', payday.toString());
  }, [payday]);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  const addExpense = () => {
    if (!amount || !category) {
      toast.error('يا باشا المبلغ والتصنيف أهم حاجة!');
      return;
    }

    const newExpense: Expense = {
      id: generateId(),
      amount: parseFloat(amount),
      description: description || 'بدون وصف',
      category,
      date: new Date().toISOString(),
    };

    setExpenses([newExpense, ...expenses]);
    setAmount('');
    setDescription('');
    setCategory('');
    toast.success('تم الحفظ بنجاح يا ريس!');
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
    toast.info('اتمسح خلاص!');
  };

  const addCategory = () => {
    if (!newCategoryName) return;
    if (categories.some(c => c.name === newCategoryName)) {
      toast.error('التصنيف ده موجود أصلاً!');
      return;
    }
    const newCat: Category = {
      id: generateId(),
      name: newCategoryName,
    };
    setCategories([...categories, newCat]);
    setNewCategoryName('');
    toast.success('ضفنا التصنيف الجديد!');
  };

  const currentCycleRange = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    let startDate: Date;
    let endDate: Date;

    if (currentDay >= payday) {
      // We are in the cycle that started this month
      startDate = new Date(currentYear, currentMonth, payday);
      endDate = new Date(currentYear, currentMonth + 1, payday - 1, 23, 59, 59);
    } else {
      // We are in the cycle that started last month
      startDate = new Date(currentYear, currentMonth - 1, payday);
      endDate = new Date(currentYear, currentMonth, payday - 1, 23, 59, 59);
    }

    return { startDate, endDate };
  }, [payday]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const expenseDate = new Date(e.date);
      const isInCycle = expenseDate >= currentCycleRange.startDate && expenseDate <= currentCycleRange.endDate;
      const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
      return isInCycle && matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, filterCategory, currentCycleRange]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      stats[e.category] = (stats[e.category] || 0) + e.amount;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-emerald-100" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Wallet size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">مساعد كيسة</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">المحاسب الشخصي بتاعك</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger render={<Button variant="ghost" size="sm" className="gap-2 rounded-full text-slate-500" />}>
                <Settings size={16} />
                <span>يوم القبض: {payday}</span>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-right">إعدادات دورة الشهر</DialogTitle>
                  <DialogDescription className="text-right">
                    حدد اليوم اللي بتقبض فيه عشان نحسب مصاريفك من اليوم ده لليوم اللي قبله الشهر الجاي.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="payday" className="text-right">يوم القبض (١ - ٣١)</Label>
                    <Input
                      id="payday"
                      type="number"
                      min="1"
                      max="31"
                      value={payday}
                      onChange={(e) => setPayday(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="text-right"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger render={<Button variant="outline" size="sm" className="gap-2 rounded-full border-slate-200 hover:bg-slate-50" />}>
                <PlusCircle size={16} />
                <span>تصنيف جديد</span>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-right">إضافة تصنيف جديد</DialogTitle>
                  <DialogDescription className="text-right">
                    ضيف خانة مصروف جديدة عشان تسهل على نفسك التسجيل بعدين.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-right">اسم التصنيف</Label>
                    <Input
                      id="name"
                      placeholder="مثلاً: خروجات، جيم، هدايا..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="text-right"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addCategory} className="w-full bg-emerald-600 hover:bg-emerald-700">حفظ التصنيف</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Stats & Add */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="overflow-hidden border-none shadow-xl shadow-emerald-100/50 bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-emerald-100 font-medium text-sm">إجمالي المصاريف</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black tracking-tight">{totalExpenses.toLocaleString()}</span>
                    <span className="text-emerald-200 font-medium">جنيه</span>
                  </div>
                </CardContent>
                <CardFooter className="bg-white/10 py-3">
                  <div className="flex justify-between w-full text-xs font-medium">
                    <span className="flex items-center gap-1">
                      <ArrowDownLeft size={14} /> 
                      الدورة الحالية: {currentCycleRange.startDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="opacity-80">لحد {currentCycleRange.endDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Add Expense Form */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="text-emerald-600" size={20} />
                  سجل مصروف جديد
                </CardTitle>
                <CardDescription>اكتب صرفت كام وفين دلوقت عشان متنساش.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>المبلغ (بالجنيه)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="pl-10 text-lg font-semibold h-12 border-slate-200 focus:ring-emerald-500 text-right"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">EGP</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>صرفتهم في إيه؟ (اختياري)</Label>
                  <Input
                    placeholder="مثلاً: غدا من عند البرنس"
                    className="h-12 border-slate-200 focus:ring-emerald-500 text-right"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>التصنيف</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-12 border-slate-200 text-right">
                      <SelectValue placeholder="اختار التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name} className="text-right">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={addExpense}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-md shadow-lg shadow-emerald-100 transition-all active:scale-95"
                >
                  حفظ المصروف
                </Button>
              </CardFooter>
            </Card>

            {/* Category Breakdown */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <PieChart size={16} />
                  توزيع المصاريف
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryStats.length > 0 ? (
                    categoryStats.map(([name, amount]) => (
                      <div key={name} className="space-y-1">
                        <div className="flex justify-between text-sm font-medium">
                          <span>{name}</span>
                          <span className="text-slate-500">{amount.toLocaleString()} ج.م</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(amount / totalExpenses) * 100}%` }}
                            className="h-full bg-emerald-500"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-slate-400 text-sm italic">لسه مفيش بيانات عشان نحللها..</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-slate-200 shadow-sm min-h-[600px] flex flex-col">
              <CardHeader className="border-b bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="text-emerald-600" size={20} />
                      سجل المصاريف
                    </CardTitle>
                    <CardDescription>كل اللي صرفته متسجل هنا بالمليم.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative w-full sm:w-48">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <Input 
                        placeholder="دور هنا..." 
                        className="pr-9 h-9 text-xs border-slate-200 text-right"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-full sm:w-32 h-9 text-xs border-slate-200 text-right">
                        <Filter size={14} className="ml-1" />
                        <SelectValue placeholder="كل التصنيفات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-right">الكل</SelectItem>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.name} className="text-right">{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-grow overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="text-right">المصروف</TableHead>
                      <TableHead className="text-right">التصنيف</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {filteredExpenses.length > 0 ? (
                        filteredExpenses.map((e) => (
                          <motion.tr
                            key={e.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="group hover:bg-slate-50/80 transition-colors"
                          >
                            <TableCell className="font-medium text-right">{e.description}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none font-medium">
                                {e.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold text-slate-900 text-right">{e.amount.toLocaleString()} ج.م</TableCell>
                            <TableCell className="text-slate-400 text-xs text-right">
                              {new Date(e.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteExpense(e.id)}
                                className="text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </TableCell>
                          </motion.tr>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-64 text-center text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                <Search size={24} />
                              </div>
                              <p>مفيش حاجة متسجلة هنا لسه..</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>

      <footer className="py-8 border-t bg-white mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">مساعد كيسة الشخصي © ٢٠٢٦ - خليك محاسب نفسك</p>
        </div>
      </footer>
    </div>
  );
}
