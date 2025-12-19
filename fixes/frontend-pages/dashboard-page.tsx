// =============================================================================
// HEALTHPAY - DASHBOARD PAGE (NULL-SAFE)
// 
// Fixes:
// 1. Handles null wallet gracefully
// 2. Handles missing transaction fields (netAmount)
// 3. Token timing fix (extracts from URL)
// 4. Proper error handling
//
// File: apps/wallet-dashboard/app/dashboard/page.tsx
// =============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { gql, useQuery } from '@apollo/client';

// =============================================================================
// GRAPHQL QUERY - Request only fields that exist
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
      description
      status
      createdAt
    }
    hasPinSet
  }
`;

// =============================================================================
// DASHBOARD CONTENT
// =============================================================================

function DashboardContent() {
  const router = useRouter();
  const { data, loading, error, refetch } = useQuery(GET_DASHBOARD, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  const logout = () => {
    localStorage.removeItem('healthpay_token');
    localStorage.removeItem('healthpay_user');
    window.location.href = '/login';
  };

  // Loading
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

  // Error handling
  if (error) {
    console.error('[Dashboard] Error:', error);
    
    // Check for specific errors
    const errorMessage = error.message || '';
    
    // Auth errors - redirect to login
    if (errorMessage.includes('Not authenticated') || 
        errorMessage.includes('Unauthorized') ||
        errorMessage.includes('jwt')) {
      logout();
      return null;
    }

    // GraphQL field errors (like netAmount) - still render with available data
    if (errorMessage.includes('Cannot return null') || 
        errorMessage.includes('non-nullable field')) {
      console.warn('[Dashboard] Field error, attempting to render with partial data');
      // Continue with partial data if available
      if (data?.me && data?.getWallet) {
        // Don't return error, let it render below
      } else {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg max-w-md">
              <span className="text-5xl">⚠️</span>
              <h2 className="text-xl font-bold text-gray-800 mt-4">خطأ في تحميل البيانات</h2>
              <p className="text-gray-600 mt-2 text-sm">{errorMessage}</p>
              <div className="mt-6 space-y-3">
                <button onClick={() => refetch()} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold">
                  إعادة المحاولة
                </button>
                <button onClick={logout} className="w-full text-gray-600 py-2">
                  تسجيل الخروج
                </button>
              </div>
            </div>
          </div>
        );
      }
    }
  }

  // Extract data with null safety
  const user = data?.me;
  const wallet = data?.getWallet;
  const transactions = data?.getTransactions || [];
  const hasPinSet = data?.hasPinSet ?? false;

  // Format helpers
  const fmt = (n: any) => (Number(n) || 0).toLocaleString('ar-EG');
  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return d;
    }
  };

  // Get transaction amount safely
  const getTxAmount = (tx: any) => {
    return Number(tx.netAmount ?? tx.net_amount ?? tx.amount ?? 0);
  };

  // Check if transaction is credit
  const isCredit = (type: string) => {
    const t = (type || '').toUpperCase();
    return t === 'CREDIT' || t === 'TOPUP' || t === 'TRANSFER_IN';
  };

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
            <button
              onClick={logout}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors"
            >
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
            <a 
              href="/settings/pin"
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
            >
              إنشاء
            </a>
          </div>
        )}

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
          <p className="text-emerald-100 text-sm mb-1">الرصيد المتاح</p>
          <h2 className="text-4xl font-bold">
            {wallet ? fmt(wallet.availableBalance) : '---'}
            <span className="text-lg mr-2">ج.م</span>
          </h2>
          
          <div className="mt-6 pt-4 border-t border-white/20 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-emerald-100">الرصيد الكلي</p>
              <p className="font-bold">{wallet ? fmt(wallet.balance) : '---'} ج.م</p>
            </div>
            <div>
              <p className="text-emerald-100">معلق</p>
              <p className="font-bold">{wallet ? fmt(wallet.pendingBalance) : '0'} ج.م</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: '💳', label: 'شحن', href: '/topup', color: 'bg-blue-50' },
            { icon: '📤', label: 'تحويل', href: '/transfer', color: 'bg-purple-50' },
            { icon: '📥', label: 'استلام', href: '/receive', color: 'bg-green-50' },
            { icon: '📋', label: 'السجل', href: '/history', color: 'bg-orange-50' },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className={`${action.color} rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-all hover:-translate-y-1`}
            >
              <span className="text-2xl block mb-2">{action.icon}</span>
              <span className="text-xs text-gray-700 font-medium">{action.label}</span>
            </a>
          ))}
        </div>

        {/* Recent Transactions */}
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
                      <p className="text-xs text-gray-500">{fmtDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`font-bold ${isCredit(tx.type) ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isCredit(tx.type) ? '+' : '-'}{fmt(getTxAmount(tx))} ج.م
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
          {[
            { icon: '🏠', label: 'الرئيسية', href: '/dashboard', active: true },
            { icon: '💳', label: 'البطاقات', href: '/cards', active: false },
            { icon: '📊', label: 'التقارير', href: '/reports', active: false },
            { icon: '⚙️', label: 'الإعدادات', href: '/settings', active: false },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${
                item.active ? 'text-emerald-600' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}

// =============================================================================
// MAIN PAGE - TOKEN HANDLING
// =============================================================================

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tokenState, setTokenState] = useState<'checking' | 'ready' | 'missing'>('checking');

  useEffect(() => {
    console.log('[Dashboard] Initializing...');
    
    // 1. Check URL for token
    const urlToken = searchParams.get('token');
    if (urlToken) {
      console.log('[Dashboard] Found token in URL');
      localStorage.setItem('healthpay_token', urlToken);
      
      // Try to extract user from JWT
      try {
        const payload = JSON.parse(atob(urlToken.split('.')[1]));
        localStorage.setItem('healthpay_user', JSON.stringify({
          id: payload.userId || payload.sub,
          phoneNumber: payload.phoneNumber,
        }));
      } catch (e) {
        console.log('[Dashboard] Could not decode JWT');
      }
      
      // Clean URL
      window.history.replaceState({}, '', '/dashboard');
      setTokenState('ready');
      return;
    }
    
    // 2. Check localStorage
    const storedToken = localStorage.getItem('healthpay_token');
    if (storedToken) {
      console.log('[Dashboard] Found token in localStorage');
      setTokenState('ready');
      return;
    }
    
    // 3. No token
    console.log('[Dashboard] No token found');
    setTokenState('missing');
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  }, [searchParams, router]);

  // Loading states
  if (tokenState === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  if (tokenState === 'missing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">جاري التحويل...</p>
        </div>
      </div>
    );
  }

  // Render dashboard
  return <DashboardContent />;
}
