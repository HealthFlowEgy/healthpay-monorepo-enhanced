// =============================================================================
// HEALTHPAY - DASHBOARD FIX
// 
// File: apps/wallet-dashboard/src/app/dashboard/page.tsx
// 
// This file shows the specific fixes needed. You can either:
// A) Replace the entire file with this
// B) Apply the specific changes marked with "// FIX:" comments
// =============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { gql, useQuery } from '@apollo/client';

// =============================================================================
// FIX 1: Updated GraphQL query - remove netAmount if causing issues
// =============================================================================

const GET_DASHBOARD = gql`
  query GetDashboard {
    me {
      id
      phoneNumber
      fullName
      firstName
      lastName
      status
      kycLevel
    }
    getWallet {
      id
      balance
      availableBalance
      pendingBalance
      currency
    }
    getTransactions(limit: 5) {
      id
      type
      amount
      # FIX: netAmount is optional - we'll fallback to amount if null
      netAmount
      description
      status
      createdAt
    }
    hasPinSet
  }
`;

// =============================================================================
// FIX 2: Helper function to safely get transaction amount
// =============================================================================

const getTransactionAmount = (tx: any): number => {
  // FIX: Fallback chain - netAmount -> net_amount -> amount -> 0
  return Number(tx?.netAmount ?? tx?.net_amount ?? tx?.amount ?? 0);
};

// =============================================================================
// FIX 3: Helper to check if transaction is credit
// =============================================================================

const isCredit = (type: string): boolean => {
  const t = (type || '').toUpperCase();
  return t === 'CREDIT' || t === 'TOPUP' || t === 'TRANSFER_IN';
};

// =============================================================================
// FIX 4: Safe number formatter
// =============================================================================

const formatMoney = (value: any): string => {
  const num = Number(value);
  if (isNaN(num)) return '0';
  return num.toLocaleString('ar-EG');
};

// =============================================================================
// DASHBOARD CONTENT COMPONENT
// =============================================================================

function DashboardContent() {
  const router = useRouter();
  
  // FIX 5: Add errorPolicy to handle partial data
  const { data, loading, error, refetch } = useQuery(GET_DASHBOARD, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all', // FIX: Continue even if some fields fail
  });

  const logout = () => {
    localStorage.removeItem('healthpay_token');
    localStorage.removeItem('healthpay_user');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // FIX 6: Better error handling - don't crash on field errors
  if (error) {
    console.error('[Dashboard] Error:', error);
    
    const errorMessage = error.message || '';
    
    // Auth errors - redirect to login
    if (errorMessage.includes('Not authenticated') || 
        errorMessage.includes('Unauthorized') ||
        errorMessage.includes('jwt')) {
      logout();
      return null;
    }

    // FIX: For field errors (like netAmount), continue with available data
    if (errorMessage.includes('Cannot return null') && data?.me && data?.getWallet) {
      console.warn('[Dashboard] Field error, continuing with partial data');
      // Don't return error, continue to render
    } else if (!data?.me || !data?.getWallet) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl p-8 text-center shadow-lg max-w-md">
            <span className="text-5xl">⚠️</span>
            <h2 className="text-xl font-bold text-gray-800 mt-4">خطأ</h2>
            <p className="text-gray-600 mt-2">{errorMessage}</p>
            <button onClick={() => refetch()} className="mt-4 bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold">
              إعادة المحاولة
            </button>
          </div>
        </div>
      );
    }
  }

  // FIX 7: Safe data extraction with fallbacks
  const user = data?.me;
  const wallet = data?.getWallet;
  const transactions = data?.getTransactions || [];
  const hasPinSet = data?.hasPinSet ?? false;

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-emerald-100 text-sm">مرحباً</p>
              <h1 className="text-xl font-bold">
                {user?.fullName || user?.firstName || 'مستخدم'}
              </h1>
            </div>
            <button onClick={logout} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm">
              خروج
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* PIN Alert */}
        {!hasPinSet && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-yellow-800">🔐 أنشئ رمز PIN</p>
              <p className="text-yellow-700 text-sm">لتتمكن من إجراء التحويلات</p>
            </div>
            <a href="/settings/pin" className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-bold">
              إنشاء
            </a>
          </div>
        )}

        {/* Balance Card - FIX 8: Safe balance display */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
          <p className="text-emerald-100 text-sm mb-1">الرصيد المتاح</p>
          <h2 className="text-4xl font-bold">
            {wallet ? formatMoney(wallet.availableBalance) : '---'}
            <span className="text-lg mr-2">ج.م</span>
          </h2>
          
          <div className="mt-6 pt-4 border-t border-white/20 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-emerald-100">الرصيد الكلي</p>
              <p className="font-bold">{wallet ? formatMoney(wallet.balance) : '---'} ج.م</p>
            </div>
            <div>
              <p className="text-emerald-100">معلق</p>
              <p className="font-bold">{wallet ? formatMoney(wallet.pendingBalance || 0) : '0'} ج.م</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: '💳', label: 'شحن', href: '/topup' },
            { icon: '📤', label: 'تحويل', href: '/transfer' },
            { icon: '📥', label: 'استلام', href: '/receive' },
            { icon: '📋', label: 'السجل', href: '/history' },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-all"
            >
              <span className="text-2xl block mb-2">{action.icon}</span>
              <span className="text-xs text-gray-700 font-medium">{action.label}</span>
            </a>
          ))}
        </div>

        {/* Transactions - FIX 9: Safe transaction rendering */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">آخر المعاملات</h3>
            <a href="/history" className="text-emerald-600 text-sm hover:underline">عرض الكل</a>
          </div>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">📭</span>
              <p className="text-gray-500 mt-2">لا توجد معاملات بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {isCredit(tx.type) ? '📥' : '📤'}
                    </span>
                    <div>
                      <p className="font-medium text-gray-800">
                        {tx.description || 
                         (tx.type === 'TOPUP' ? 'شحن رصيد' : 
                          tx.type === 'TRANSFER_IN' ? 'تحويل وارد' :
                          tx.type === 'TRANSFER_OUT' ? 'تحويل صادر' :
                          tx.type)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('ar-EG') : ''}
                      </p>
                    </div>
                  </div>
                  {/* FIX 10: Safe amount display with fallback */}
                  <span className={`font-bold ${isCredit(tx.type) ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isCredit(tx.type) ? '+' : '-'}
                    {formatMoney(getTransactionAmount(tx))} ج.م
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3">معلومات الحساب</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">رقم الهاتف</span>
              <span className="font-mono" dir="ltr">{user?.phoneNumber || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">الحالة</span>
              <span className="text-emerald-600">
                {user?.status?.toLowerCase() === 'active' ? 'نشط' : (user?.status || '-')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">رمز PIN</span>
              <span className={hasPinSet ? 'text-emerald-600' : 'text-yellow-600'}>
                {hasPinSet ? 'مفعل ✓' : 'غير مفعل'}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-lg mx-auto flex justify-around py-3">
          <a href="/dashboard" className="flex flex-col items-center text-emerald-600">
            <span className="text-xl">🏠</span><span className="text-xs">الرئيسية</span>
          </a>
          <a href="/cards" className="flex flex-col items-center text-gray-500">
            <span className="text-xl">💳</span><span className="text-xs">البطاقات</span>
          </a>
          <a href="/reports" className="flex flex-col items-center text-gray-500">
            <span className="text-xl">📊</span><span className="text-xs">التقارير</span>
          </a>
          <a href="/settings" className="flex flex-col items-center text-gray-500">
            <span className="text-xl">⚙️</span><span className="text-xs">الإعدادات</span>
          </a>
        </div>
      </nav>
    </div>
  );
}

// =============================================================================
// MAIN PAGE - Token handling wrapper
// =============================================================================

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tokenState, setTokenState] = useState<'checking' | 'ready' | 'missing'>('checking');

  useEffect(() => {
    // Check URL for token
    const urlToken = searchParams.get('token');
    if (urlToken) {
      localStorage.setItem('healthpay_token', urlToken);
      window.history.replaceState({}, '', '/dashboard');
      setTokenState('ready');
      return;
    }
    
    // Check localStorage
    const storedToken = localStorage.getItem('healthpay_token');
    if (storedToken) {
      setTokenState('ready');
      return;
    }
    
    // No token
    setTokenState('missing');
    setTimeout(() => { window.location.href = '/login'; }, 100);
  }, [searchParams, router]);

  if (tokenState === 'checking' || tokenState === 'missing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <DashboardContent />;
}
