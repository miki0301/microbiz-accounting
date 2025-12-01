import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Minus, 
  FileText, 
  PieChart, 
  Home, 
  Save, 
  Trash2, 
  Receipt, 
  QrCode, 
  MoreHorizontal,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Download,
  FileSpreadsheet,
  Printer,
  User,
  MapPin,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Train,
  Calculator,
  Settings,
  X,
  Briefcase,
  Clock,
  CheckCircle,
  AlertTriangle,
  BellRing
} from 'lucide-react';

// --- 定義會計科目分類 ---
const INCOME_CATEGORIES = [
  { id: 'sales', name: '銷貨收入' },
  { id: 'service', name: '勞務收入' },
  { id: 'other_income', name: '其他收入' },
];

const EXPENSE_CATEGORIES = [
  { id: 'cogs', name: '進貨成本' },
  { id: 'salary', name: '薪資支出' },
  { id: 'part_time', name: '兼職/勞務費' },
  { id: 'rent', name: '租金支出' },
  { id: 'stationery', name: '文具用品' },
  { id: 'travel', name: '旅費/交通費' },
  { id: 'shipping', name: '運費' },
  { id: 'postage', name: '郵電費' },
  { id: 'repair', name: '修繕費' },
  { id: 'advertisement', name: '廣告費' },
  { id: 'entertainment', name: '交際費' },
  { id: 'tax', name: '稅捐' },
  { id: 'utilities', name: '水電瓦斯' },
  { id: 'other_expense', name: '其他費用' },
];

const getCategoryName = (id, type) => {
    const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return list.find(c => c.id === id)?.name || id;
};

const getVoucherName = (type) => {
    switch(type) {
        case 'paper': return '紙本';
        case 'electronic': return '電子';
        case 'other': return '其他';
        default: return '未分類';
    }
};

export default function MicroBizApp() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [showSettings, setShowSettings] = useState(false); 

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('microBizTransactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [companyCapital, setCompanyCapital] = useState(() => {
    const saved = localStorage.getItem('microBizCapital');
    return saved ? saved : ''; 
  });
  
  const [formData, setFormData] = useState({
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: EXPENSE_CATEGORIES[0].id,
    voucherType: 'electronic',
    isNonCash: false,
    note: '',
    applicantName: '',
    travelStart: '',
    travelEnd: '',
    travelReason: '洽公',
    travelMethod: '', 
    payeeName: '',
    payeeId: '',
    payeeAddress: '',
    taxWithheld: 0, 
    healthIns: 0,
    customerName: '',
    paymentTerms: 0,
    paymentStatus: 'paid',
  });

  useEffect(() => {
    localStorage.setItem('microBizTransactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('microBizCapital', companyCapital.toString());
  }, [companyCapital]);

  // --- 自動試算邏輯 ---
  const calculateDeductions = (amount, category) => {
    if (['salary', 'part_time'].includes(category)) {
        const amt = parseFloat(amount) || 0;
        const tax = Math.round(amt * 0.10);
        const health = Math.round(amt * 0.0211);
        return { tax, health };
    }
    return { tax: 0, health: 0 };
  };

  const handleAmountChange = (e) => {
    const newAmount = e.target.value;
    const { tax, health } = calculateDeductions(newAmount, formData.category);
    
    setFormData(prev => ({
        ...prev,
        amount: newAmount,
        taxWithheld: ['salary', 'part_time'].includes(prev.category) ? tax : prev.taxWithheld,
        healthIns: ['salary', 'part_time'].includes(prev.category) ? health : prev.healthIns
    }));
  };

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    const { tax, health } = calculateDeductions(formData.amount, newCategory);

    setFormData(prev => ({
        ...prev,
        category: newCategory,
        taxWithheld: ['salary', 'part_time'].includes(newCategory) ? tax : 0,
        healthIns: ['salary', 'part_time'].includes(newCategory) ? health : 0
    }));
  };

  const togglePaymentStatus = (id) => {
      setTransactions(transactions.map(t => {
          if (t.id === id) {
              return { ...t, paymentStatus: t.paymentStatus === 'paid' ? 'unpaid' : 'paid' };
          }
          return t;
      }));
  };

  const stats = useMemo(() => {
    const viewYear = currentDate.getFullYear();
    const viewMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    const viewMonthStr = `${viewYear}-${viewMonth}`;
    const today = new Date();
    
    let monthActualIncome = 0;
    let monthActualExpense = 0;
    let monthTotalDeductibleExpense = 0;
    let monthTransactions = [];
    let expenseByCategory = {}; 

    let monthTotalSales = 0; 
    let monthReceivable = 0; 
    let monthCollected = 0; 

    let globalActualIncome = 0;
    let globalActualExpense = 0;
    let overdueInvoices = [];

    transactions.forEach(t => {
      const amt = parseFloat(t.amount) || 0;

      if (t.type === 'income' && t.paymentStatus === 'unpaid') {
          const transDate = new Date(t.date);
          const terms = parseInt(t.paymentTerms || 0);
          const dueDate = new Date(transDate);
          dueDate.setDate(dueDate.getDate() + terms);
          
          if (today > dueDate) {
              const diffTime = Math.abs(today - dueDate);
              const delayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              overdueInvoices.push({ ...t, delayDays, dueDate: dueDate.toISOString().split('T')[0] });
          }
      }

      if (t.type === 'income') {
        if (t.paymentStatus === 'paid') {
            globalActualIncome += amt;
        }
      } else {
        if (!t.isNonCash) {
          globalActualExpense += amt;
        }
      }

      if (t.date.startsWith(viewMonthStr)) {
        monthTransactions.push(t);

        if (t.type === 'income') {
          monthTotalSales += amt;
          if (t.paymentStatus === 'paid') {
              monthCollected += amt;
              monthActualIncome += amt;
          } else {
              monthReceivable += amt;
          }
        } else {
          if (!t.isNonCash) {
            monthActualExpense += amt;
          }
          monthTotalDeductibleExpense += amt;

          if (!expenseByCategory[t.category]) {
            expenseByCategory[t.category] = 0;
          }
          expenseByCategory[t.category] += amt;
        }
      }
    });

    const topExpenses = Object.entries(expenseByCategory)
        .map(([id, amount]) => ({
            id,
            name: getCategoryName(id, 'expense'),
            amount,
            percentage: monthTotalDeductibleExpense > 0 ? (amount / monthTotalDeductibleExpense) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount);
    
    const capitalNum = parseFloat(companyCapital) || 0;
    const totalAccountBalance = capitalNum + globalActualIncome - globalActualExpense;

    return {
      monthStr: viewMonthStr,
      displayMonth: `${viewYear}年 ${viewMonth}月`,
      monthActualBalance: monthActualIncome - monthActualExpense,
      monthTaxBalance: monthActualIncome - monthTotalDeductibleExpense, 
      monthActualIncome,
      monthTotalDeductibleExpense,
      monthTotalSales,
      monthReceivable,
      monthCollected,
      monthSalesTax: Math.round(monthTotalSales * 0.05),
      overdueInvoices: overdueInvoices.sort((a, b) => b.date.localeCompare(a.date)),
      count: monthTransactions.length,
      transactions: monthTransactions.sort((a, b) => b.date.localeCompare(a.date)),
      topExpenses,
      totalAccountBalance
    };
  }, [transactions, currentDate, companyCapital]);

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) {
      alert('請輸入金額與分類');
      return;
    }

    const newTransaction = {
      id: Date.now().toString(),
      ...formData,
      amount: parseFloat(formData.amount),
      taxWithheld: parseFloat(formData.taxWithheld) || 0,
      healthIns: parseFloat(formData.healthIns) || 0,
      paymentTerms: parseInt(formData.paymentTerms) || 0,
    };

    setTransactions([newTransaction, ...transactions]);
    setCurrentDate(new Date(formData.date));

    setFormData({
      ...formData,
      amount: '',
      note: '',
      customerName: '',
      paymentTerms: 0,
      paymentStatus: 'paid',
      applicantName: '',
      travelStart: '',
      travelEnd: '',
      travelMethod: '',
      payeeName: '',
      payeeId: '',
      payeeAddress: '',
      taxWithheld: 0,
      healthIns: 0,
    });
    
    alert('紀錄已儲存！');
    setActiveTab('home');
  };

  const deleteTransaction = (id) => {
    if (confirm('確定要刪除這筆紀錄嗎？')) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const exportToCSV = () => {
    if (transactions.length === 0) return;
    const headers = ["交易日期", "收支類型", "會計科目", "金額", "客戶名稱", "付款條件", "收款狀態", "憑證類型", "備註", "申請人", "起點", "終點", "交通方式", "所得人", "統編/ID", "代扣稅", "二代健保"];
    const rows = transactions.map(t => [
      t.date,
      t.type === 'income' ? '收入' : '支出',
      getCategoryName(t.category, t.type),
      t.amount,
      t.customerName || '',
      t.paymentTerms ? `${t.paymentTerms}天` : '現銷',
      t.paymentStatus === 'paid' ? '已收' : '未收',
      getVoucherName(t.voucherType),
      `"${t.note || ''}"`,
      t.applicantName || '',
      t.travelStart || '',
      t.travelEnd || '',
      t.travelMethod || '', 
      t.payeeName || '',
      t.payeeId || '',
      t.taxWithheld || 0,
      t.healthIns || 0
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `微型企業帳務_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // --- UI Components ---
  
  const SettingsModal = () => (
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animation-fade-in" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Settings className="text-blue-600" /> 設定</h3>
                  <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-600 mb-2">公司資本額 (初始資金)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400 font-mono">$</span>
                    <input type="number" value={companyCapital} onChange={(e) => setCompanyCapital(e.target.value)} className="w-full pl-8 p-3 border border-slate-300 rounded-xl outline-none text-lg font-bold text-slate-700" placeholder="0" />
                  </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">完成</button>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {showSettings && <SettingsModal />}
      
      <main className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative">
        
        {/* --- Home View --- */}
        {activeTab === 'home' && (
          <div className="space-y-6 pb-20">
            <header className="bg-slate-800 text-white p-6 rounded-b-3xl shadow-lg relative">
              <div className="flex justify-between items-center mb-4">
                  <h1 className="text-xl font-bold">微型企業管帳</h1>
                  <button onClick={() => setShowSettings(true)} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors">
                      <Settings size={20} className="text-slate-200" />
                  </button>
              </div>
              <div className="flex justify-between items-center mb-6 bg-slate-700/50 p-1 rounded-full">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-600 rounded-full transition-colors"><ChevronLeft size={20} /></button>
                <span className="text-sm font-bold tracking-wider">{stats.displayMonth}</span>
                <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-600 rounded-full transition-colors"><ChevronRight size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-4 rounded-xl shadow-lg border border-emerald-500/30">
                  <p className="text-emerald-100 text-xs mb-1 flex items-center gap-1"><Wallet size={12} /> 帳戶實際總額</p>
                  <p className="text-2xl font-bold text-white tracking-tight">${stats.totalAccountBalance.toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-200/70 mt-1">資本額+已收-實支</p>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-xl backdrop-blur-sm border border-slate-600">
                  <p className="text-slate-300 text-xs mb-1">本月銷貨(含應收)</p>
                  <p className={`text-xl font-bold ${stats.monthTotalSales >= 0 ? 'text-blue-400' : 'text-slate-400'}`}>${stats.monthTotalSales.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 mt-1">待收: ${stats.monthReceivable.toLocaleString()}</p>
                </div>
              </div>
            </header>

            {stats.overdueInvoices.length > 0 && (
                <div className="px-4 animation-pulse">
                    <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <BellRing className="text-rose-600 animate-bounce" size={20} />
                            <h3 className="font-bold text-rose-800">催帳警示：{stats.overdueInvoices.length} 筆逾期</h3>
                        </div>
                        <div className="space-y-2">
                            {stats.overdueInvoices.map(inv => (
                                <div key={inv.id} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-rose-100">
                                    <div>
                                        <span className="font-bold text-slate-700">{inv.customerName}</span>
                                        <div className="text-xs text-rose-500">延遲 {inv.delayDays} 天 (到期: {inv.dueDate})</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-rose-700">${inv.amount.toLocaleString()}</div>
                                        <button onClick={() => togglePaymentStatus(inv.id)} className="text-[10px] bg-rose-100 text-rose-700 px-2 py-1 rounded mt-1 hover:bg-rose-200">標記已收</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="px-4 space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-slate-700 font-bold mb-3 flex items-center gap-2 text-sm"><BarChart3 size={16} className="text-blue-500"/> 本月收支概況</h3>
                  {stats.monthActualIncome === 0 && stats.monthTotalDeductibleExpense === 0 ? (
                      <div className="text-xs text-slate-400 text-center py-4">本月尚無數據</div>
                  ) : (
                      <div className="space-y-3">
                          <div className="space-y-1">
                              <div className="flex justify-between text-xs"><span className="text-emerald-700">實收現金</span><span className="font-mono">${stats.monthActualIncome.toLocaleString()}</span></div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: stats.monthActualIncome > 0 ? '100%' : '0%' }}></div>
                              </div>
                          </div>
                          <div className="space-y-1">
                              <div className="flex justify-between text-xs"><span className="text-rose-700">總支出 (含抵扣)</span><span className="font-mono">${stats.monthTotalDeductibleExpense.toLocaleString()}</span></div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min((stats.monthTotalDeductibleExpense / (Math.max(stats.monthActualIncome, stats.monthTotalDeductibleExpense) || 1)) * 100, 100)}%` }}></div>
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              <div>
                  <h2 className="text-slate-700 font-bold mb-3 flex items-center gap-2 text-sm mt-6"><FileText size={16} /> 本月明細 ({stats.count}筆)</h2>
                  {stats.transactions.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-sm">本月尚無紀錄</div>
                  ) : (
                  <div className="space-y-3">
                      {stats.transactions.map(t => (
                      <div key={t.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center relative overflow-hidden">
                          {t.type === 'income' && (
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${t.paymentStatus === 'paid' ? 'bg-emerald-400' : 'bg-orange-400'}`}></div>
                          )}
                          <div className="flex-1 ml-2">
                              <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{t.type === 'income' ? '收' : '支'}</span>
                                  <span className="font-bold text-slate-700 text-sm">{t.type === 'income' && t.customerName ? t.customerName : getCategoryName(t.category, t.type)}</span>
                                  {t.type === 'income' && (
                                      <button onClick={(e) => { e.stopPropagation(); togglePaymentStatus(t.id); }} className={`text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-1 cursor-pointer transition-colors ${t.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                                          {t.paymentStatus === 'paid' ? <CheckCircle size={8}/> : <Clock size={8}/>}
                                          {t.paymentStatus === 'paid' ? '已收款' : '未收款'}
                                      </button>
                                  )}
                              </div>
                              <div className="text-xs text-slate-500 flex gap-3">
                                  <span>{t.date.slice(5)}</span>
                                  {t.type === 'income' && t.paymentTerms > 0 && <span className="text-slate-400">{t.paymentTerms}天票期</span>}
                                  {t.note && <span className="truncate max-w-[100px] text-slate-400">| {t.note}</span>}
                              </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                              <span className={`font-mono font-bold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>{t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}</span>
                              <button onClick={() => deleteTransaction(t.id)} className="text-slate-300 hover:text-rose-500 p-1"><Trash2 size={14} /></button>
                          </div>
                      </div>
                      ))}
                  </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* --- Add View --- */}
        {activeTab === 'add' && (
          <div className="p-4 pb-20 max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">新增紀錄</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button type="button" className={`flex-1 py-3 rounded-md font-bold transition-all flex justify-center items-center gap-2 ${formData.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`} onClick={() => setFormData({...formData, type: 'income', category: INCOME_CATEGORIES[0].id})}>
                  <TrendingUp size={18} /> 收入
                </button>
                <button type="button" className={`flex-1 py-3 rounded-md font-bold transition-all flex justify-center items-center gap-2 ${formData.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`} onClick={() => setFormData({...formData, type: 'expense', category: EXPENSE_CATEGORIES[0].id})}>
                  <TrendingDown size={18} /> 支出
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">金額 (TWD)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={handleAmountChange}
                  className="w-full text-3xl font-mono p-4 border-b-2 border-slate-200 focus:border-blue-500 outline-none bg-transparent"
                  placeholder="0"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">日期</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">會計科目</label>
                  <select value={formData.category} onChange={handleCategoryChange} className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20">
                    {(formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.type === 'income' && (
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3 animation-fade-in">
                      <h3 className="text-indigo-800 font-bold text-sm flex items-center gap-1"><Briefcase size={16} /> 客戶與帳款資訊</h3>
                      <input type="text" placeholder="客戶名稱 (公司名)" className="w-full p-2 border rounded border-indigo-200" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                      <div className="flex gap-2">
                          <div className="flex-1">
                              <label className="text-xs text-indigo-600 mb-1 block">付款條件(天)</label>
                              <select className="w-full p-2 border rounded border-indigo-200 bg-white" value={formData.paymentTerms} onChange={e => setFormData({...formData, paymentTerms: parseInt(e.target.value)})}>
                                  <option value={0}>現銷 (0天)</option>
                                  <option value={30}>月結 30天</option>
                                  <option value={60}>月結 60天</option>
                                  <option value={90}>月結 90天</option>
                              </select>
                          </div>
                          <div className="flex-1">
                              <label className="text-xs text-indigo-600 mb-1 block">目前狀態</label>
                              <div className="flex gap-1 p-1 bg-white border border-indigo-200 rounded">
                                  <button type="button" onClick={() => setFormData({...formData, paymentStatus: 'paid'})} className={`flex-1 text-xs py-1.5 rounded transition-colors ${formData.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700 font-bold' : 'text-slate-400'}`}>已收</button>
                                  <button type="button" onClick={() => setFormData({...formData, paymentStatus: 'unpaid'})} className={`flex-1 text-xs py-1.5 rounded transition-colors ${formData.paymentStatus === 'unpaid' ? 'bg-orange-100 text-orange-700 font-bold' : 'text-slate-400'}`}>未收</button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {formData.type === 'expense' && formData.category === 'travel' && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                  <h3 className="text-blue-800 font-bold text-sm flex items-center gap-1"><MapPin size={16}/> 交通費明細</h3>
                  <input type="text" placeholder="申請人 (如: 王小明)" className="w-full p-2 border rounded border-blue-200" value={formData.applicantName} onChange={e => setFormData({...formData, applicantName: e.target.value})} />
                  <div className="flex gap-2 items-center">
                    <input type="text" placeholder="起點" className="flex-1 p-2 border rounded border-blue-200" value={formData.travelStart} onChange={e => setFormData({...formData, travelStart: e.target.value})} />
                    <ArrowRight size={16} className="text-blue-300" />
                    <input type="text" placeholder="終點" className="flex-1 p-2 border rounded border-blue-200" value={formData.travelEnd} onChange={e => setFormData({...formData, travelEnd: e.target.value})} />
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-blue-200 rounded p-2">
                      <Train size={16} className="text-blue-400" />
                      <input type="text" placeholder="交通方式 (如: 計程車、高鐵)" className="flex-1 outline-none" value={formData.travelMethod} onChange={e => setFormData({...formData, travelMethod: e.target.value})} />
                  </div>
                  <input type="text" placeholder="洽公事由" className="w-full p-2 border rounded border-blue-200" value={formData.travelReason} onChange={e => setFormData({...formData, travelReason: e.target.value})} />
                </div>
              )}

              {formData.type === 'expense' && (formData.category === 'salary' || formData.category === 'part_time') && (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-3">
                  <h3 className="text-emerald-800 font-bold text-sm flex items-center gap-1"><Calculator size={16} /> 所得與稅額</h3>
                  <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="姓名" className="p-2 border rounded" value={formData.payeeName} onChange={e => setFormData({...formData, payeeName: e.target.value})} />
                      <input type="text" placeholder="身份證字號" className="p-2 border rounded" value={formData.payeeId} onChange={e => setFormData({...formData, payeeId: e.target.value})} />
                  </div>
                  <input type="text" placeholder="戶籍地址" className="w-full p-2 border rounded" value={formData.payeeAddress} onChange={e => setFormData({...formData, payeeAddress: e.target.value})} />
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200">
                    <div>
                        <label className="text-xs text-emerald-700 block mb-1">代扣稅額 (10%)</label>
                        <input type="number" className="w-full p-2 border rounded text-rose-600 bg-white" value={formData.taxWithheld} onChange={e => setFormData({...formData, taxWithheld: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs text-emerald-700 block mb-1">二代健保 (2.11%)</label>
                        <input type="number" className="w-full p-2 border rounded text-rose-600 bg-white" value={formData.healthIns} onChange={e => setFormData({...formData, healthIns: e.target.value})} />
                    </div>
                  </div>
                </div>
              )}

              {/* 憑證選擇 - Re-added */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">憑證種類</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'paper', label: '紙本', icon: Receipt },
                    { id: 'electronic', label: '電子', icon: QrCode },
                    { id: 'other', label: '其他', icon: MoreHorizontal },
                  ].map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setFormData({...formData, voucherType: v.id})}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        formData.voucherType === v.id 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <v.icon size={20} />
                      <span className="text-sm">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formData.type === 'expense' && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                  <input type="checkbox" id="isNonCash" checked={formData.isNonCash} onChange={e => setFormData({...formData, isNonCash: e.target.checked})} className="mt-1 w-5 h-5 accent-amber-600" />
                  <label htmlFor="isNonCash" className="cursor-pointer">
                    <span className="block font-bold text-amber-900 text-sm">非實際金流支出 (發票抵扣用)</span>
                    <span className="block text-xs text-amber-700 mt-1">錢未從公司帳戶流出，但需列入成本。</span>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">備註 (可選)</label>
                <input type="text" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="例如：發票號碼、詳細說明..." />
              </div>

              <button type="submit" className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                <Save size={20} /> 儲存紀錄
              </button>
            </form>
          </div>
        )}

        {/* --- Reports View --- */}
        {activeTab === 'reports' && (
          <div className="p-4 pb-24 max-w-lg mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4"><PieChart className="text-blue-600" /> 月底結算報表</h2>
              <div className="grid grid-cols-2 gap-3">
                  <button onClick={exportToCSV} className="bg-emerald-600 text-white px-3 py-3 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-1 shadow hover:bg-emerald-700 active:scale-95 transition-transform">
                      <FileSpreadsheet size={20} /> <span>1. 匯出 Excel (明細)</span>
                  </button>
                  {/* Print Preview Button omitted as logic is complex, assuming user knows to use browser print or I can add basic print view trigger */}
                  <button onClick={() => window.print()} className="bg-blue-600 text-white px-3 py-3 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-1 shadow hover:bg-blue-700 active:scale-95 transition-transform">
                      <Printer size={20} /> <span>2. 列印報表 (PDF)</span>
                  </button>
              </div>
            </div>

            <div className="space-y-8">
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-indigo-50 p-4 border-b border-indigo-100">
                      <h3 className="font-bold text-indigo-900 flex items-center gap-2"><Briefcase size={18} /> 銷項與應收帳款月報</h3>
                      <p className="text-xs text-indigo-600 mt-1">本月發票開立與收款情形</p>
                  </div>
                  <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                          <span className="text-slate-500">本月開立發票總額</span>
                          <span className="font-bold text-slate-800 text-lg">${stats.monthTotalSales.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                          <span className="text-slate-500">預估總營業稅額 (5%)</span>
                          <span className="font-mono text-slate-600">${stats.monthSalesTax.toLocaleString()}</span>
                      </div>
                      
                      <div className="space-y-2 pt-2">
                          <div className="flex justify-between text-xs font-bold">
                              <span className="text-emerald-600">已收款: ${stats.monthCollected.toLocaleString()}</span>
                              <span className="text-orange-500">待收款: ${stats.monthReceivable.toLocaleString()}</span>
                          </div>
                          <div className="h-3 bg-orange-100 rounded-full overflow-hidden flex">
                              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${stats.monthTotalSales > 0 ? (stats.monthCollected / stats.monthTotalSales) * 100 : 0}%` }}></div>
                          </div>
                      </div>

                      {stats.overdueInvoices.length > 0 && (
                          <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 mt-4">
                              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-2"><AlertTriangle size={14} /> 延遲支付警示 (請同仁催帳)</div>
                              <div className="space-y-2">
                                  {stats.overdueInvoices.slice(0, 3).map(inv => (
                                      <div key={inv.id} className="flex justify-between items-center text-xs bg-white p-2 rounded shadow-sm">
                                          <span>{inv.customerName}</span>
                                          <span className="font-mono font-bold text-rose-600">${inv.amount.toLocaleString()}</span>
                                      </div>
                                  ))}
                                  {stats.overdueInvoices.length > 3 && <div className="text-center text-xs text-rose-400">...還有 {stats.overdueInvoices.length - 3} 筆</div>}
                              </div>
                          </div>
                      )}
                  </div>
              </section>

              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-emerald-50 p-4 border-b border-emerald-100">
                  <h3 className="font-bold text-emerald-900 flex items-center gap-2"><Wallet size={18} /> 實際收支表 (現金流)</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm"><span className="text-slate-500">實際收入 (已收)</span><span className="font-mono text-emerald-600 font-medium">+${stats.monthActualIncome.toLocaleString()}</span></div>
                  <div className="flex justify-between items-center text-sm"><span className="text-slate-500">實際支出</span><span className="font-mono text-rose-500 font-medium">-${(stats.monthActualIncome - stats.monthActualBalance).toLocaleString()}</span></div>
                  <div className="h-px bg-slate-100 my-2"></div>
                  <div className="flex justify-between items-center"><span className="font-bold text-slate-700">本月現金結餘</span><span className={`font-mono text-xl font-bold ${stats.monthActualBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>${stats.monthActualBalance.toLocaleString()}</span></div>
                </div>
              </section>

              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-blue-50 p-4 border-b border-blue-100">
                  <h3 className="font-bold text-blue-900 flex items-center gap-2"><FileText size={18} /> 稅務與營運損益表</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm"><span className="text-slate-500">總收入 (含應收)</span><span className="font-mono text-emerald-600 font-medium">+${stats.monthTotalSales.toLocaleString()}</span></div>
                  <div className="flex justify-between items-center text-sm"><span className="text-slate-500">總支出 (含抵扣)</span><span className="font-mono text-rose-500 font-medium">-${stats.monthTotalDeductibleExpense.toLocaleString()}</span></div>
                  <div className="h-px bg-slate-100 my-2"></div>
                  <div className="flex justify-between items-center"><span className="font-bold text-slate-700">帳面損益</span><span className={`font-mono text-xl font-bold ${stats.monthTotalSales - stats.monthTotalDeductibleExpense >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>${(stats.monthTotalSales - stats.monthTotalDeductibleExpense).toLocaleString()}</span></div>
                </div>
              </section>
            </div>
          </div>
        )}

        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-200 flex justify-around py-3 px-2 z-50 safe-area-bottom">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><Home size={24} /><span className="text-[10px] font-medium">總覽</span></button>
          <button onClick={() => { setFormData({ type: 'expense', date: new Date().toISOString().split('T')[0], amount: '', category: EXPENSE_CATEGORIES[0].id, voucherType: 'electronic', isNonCash: false, note: '', applicantName: '', travelStart: '', travelEnd: '', travelMethod: '', travelReason: '洽公', payeeName: '', payeeId: '', payeeAddress: '', taxWithheld: 0, healthIns: 0, customerName: '', paymentTerms: 0, paymentStatus: 'paid' }); setActiveTab('add'); }} className="flex flex-col items-center justify-center bg-slate-800 text-white rounded-full w-14 h-14 -mt-8 shadow-lg active:scale-95 transition-transform"><Plus size={28} /></button>
          <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTab === 'reports' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><PieChart size={24} /><span className="text-[10px] font-medium">報表</span></button>
        </nav>
      </main>
    </div>
  );
}