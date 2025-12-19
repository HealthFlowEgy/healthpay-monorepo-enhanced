// =============================================================================
// HEALTHPAY - TRANSFER PAGE (COMPLETE)
// 
// Full transfer flow:
// 1. Enter recipient phone
// 2. Enter amount
// 3. Enter PIN
// 4. Confirm and send
//
// File: apps/wallet-dashboard/app/transfer/page.tsx
// =============================================================================

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gql, useMutation, useQuery } from '@apollo/client';

// =============================================================================
// GRAPHQL
// =============================================================================

const GET_WALLET = gql`
  query GetWallet {
    getWallet {
      id
      balance
      availableBalance
      currency
    }
    hasPinSet
  }
`;

const SEND_MONEY = gql`
  mutation SendMoney($input: SendMoneyInput!) {
    sendMoney(input: $input) {
      success
      message
      transaction {
        id
        amount
        recipientName
        recipientPhone
        createdAt
      }
      newBalance
    }
  }
`;

// =============================================================================
// PIN INPUT COMPONENT
// =============================================================================

function PinInput({ 
  value, 
  onChange, 
  length = 4,
  autoFocus = false,
}: { 
  value: string; 
  onChange: (val: string) => void;
  length?: number;
  autoFocus?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;
    
    const newValue = value.split('');
    newValue[index] = digit;
    const result = newValue.join('').substring(0, length);
    onChange(result);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-3" dir="ltr">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          autoFocus={autoFocus && i === 0}
          className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
        />
      ))}
    </div>
  );
}

// =============================================================================
// TRANSFER FORM
// =============================================================================

type Step = 'phone' | 'amount' | 'pin' | 'confirm' | 'success' | 'error';

export default function TransferPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  
  // Form state
  const [step, setStep] = useState<Step>('phone');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  
  // Result state
  const [result, setResult] = useState<any>(null);

  // Queries and mutations
  const { data: walletData, loading: walletLoading } = useQuery(GET_WALLET, {
    skip: !isReady,
    fetchPolicy: 'network-only',
  });

  const [sendMoney, { loading: sending }] = useMutation(SEND_MONEY);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('healthpay_token');
    if (!token) {
      router.push('/login');
      return;
    }
    setIsReady(true);
  }, [router]);

  // Check if PIN is set
  useEffect(() => {
    if (walletData && !walletData.hasPinSet) {
      // Redirect to set PIN first
      router.push('/settings/pin?redirect=/transfer');
    }
  }, [walletData, router]);

  const wallet = walletData?.getWallet;
  const balance = wallet?.availableBalance || 0;

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handlePhoneSubmit = () => {
    const cleaned = recipientPhone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setError('رقم الهاتف غير صحيح');
      return;
    }
    setError('');
    setStep('amount');
  };

  const handleAmountSubmit = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('الرجاء إدخال مبلغ صحيح');
      return;
    }
    if (num > balance) {
      setError(`الرصيد غير كافي. المتاح: ${balance.toLocaleString('ar-EG')} ج.م`);
      return;
    }
    if (num < 1) {
      setError('الحد الأدنى للتحويل 1 ج.م');
      return;
    }
    setError('');
    setStep('pin');
  };

  const handlePinSubmit = () => {
    if (pin.length !== 4) {
      setError('الرجاء إدخال رمز PIN المكون من 4 أرقام');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setError('');
    
    try {
      const response = await sendMoney({
        variables: {
          input: {
            recipientPhone,
            amount: parseFloat(amount),
            pin,
            description: description || undefined,
          },
        },
      });

      if (response.data?.sendMoney?.success) {
        setResult(response.data.sendMoney);
        setStep('success');
      } else {
        setError(response.data?.sendMoney?.message || 'فشل التحويل');
        setStep('error');
      }
    } catch (e: any) {
      console.error('Transfer error:', e);
      setError(e.message);
      
      // If PIN error, go back to PIN step
      if (e.message.toLowerCase().includes('pin')) {
        setPin('');
        setStep('pin');
      } else {
        setStep('error');
      }
    }
  };

  const resetForm = () => {
    setStep('phone');
    setRecipientPhone('');
    setAmount('');
    setPin('');
    setDescription('');
    setError('');
    setResult(null);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (!isReady || walletLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-6">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button onClick={() => router.back()} className="text-2xl">→</button>
          <h1 className="text-xl font-bold">تحويل أموال</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Balance Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <p className="text-gray-500 text-sm">الرصيد المتاح</p>
          <p className="text-2xl font-bold text-emerald-600">
            {balance.toLocaleString('ar-EG')} ج.م
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-6">
          {['phone', 'amount', 'pin', 'confirm'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s ? 'bg-emerald-500 text-white' :
                ['phone', 'amount', 'pin', 'confirm'].indexOf(step) > i ? 'bg-emerald-200 text-emerald-700' :
                'bg-gray-200 text-gray-500'
              }`}>
                {i + 1}
              </div>
              {i < 3 && <div className="w-12 h-1 bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && step !== 'success' && step !== 'error' && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        {/* Step 1: Phone */}
        {step === 'phone' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-center mb-6">
              <span className="text-5xl">📱</span>
              <h2 className="text-xl font-bold text-gray-800 mt-4">رقم المستلم</h2>
              <p className="text-gray-500">أدخل رقم هاتف المستلم</p>
            </div>

            <div className="space-y-4">
              <input
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value.replace(/[^\d+]/g, ''))}
                placeholder="01012345678"
                className="w-full px-4 py-4 border border-gray-300 rounded-xl text-lg text-left"
                dir="ltr"
                autoFocus
              />
              
              <button
                onClick={handlePhoneSubmit}
                disabled={recipientPhone.length < 10}
                className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Amount */}
        {step === 'amount' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-center mb-6">
              <span className="text-5xl">💰</span>
              <h2 className="text-xl font-bold text-gray-800 mt-4">المبلغ</h2>
              <p className="text-gray-500">أدخل المبلغ المراد تحويله</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl text-3xl text-center font-bold"
                  dir="ltr"
                  autoFocus
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">ج.م</span>
              </div>

              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 200, 500].map((q) => (
                  <button
                    key={q}
                    onClick={() => setAmount(q.toString())}
                    className="py-2 bg-gray-100 rounded-lg text-gray-700 font-medium hover:bg-emerald-100"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ملاحظة (اختياري)"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('phone')}
                  className="flex-1 py-4 border border-gray-300 rounded-xl font-bold text-gray-700"
                >
                  رجوع
                </button>
                <button
                  onClick={handleAmountSubmit}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="flex-1 bg-emerald-500 text-white py-4 rounded-xl font-bold disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: PIN */}
        {step === 'pin' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-center mb-6">
              <span className="text-5xl">🔐</span>
              <h2 className="text-xl font-bold text-gray-800 mt-4">رمز PIN</h2>
              <p className="text-gray-500">أدخل رمز PIN للتأكيد</p>
            </div>

            <div className="space-y-6">
              <PinInput value={pin} onChange={setPin} autoFocus />
              
              <div className="flex gap-3">
                <button
                  onClick={() => { setStep('amount'); setPin(''); }}
                  className="flex-1 py-4 border border-gray-300 rounded-xl font-bold text-gray-700"
                >
                  رجوع
                </button>
                <button
                  onClick={handlePinSubmit}
                  disabled={pin.length !== 4}
                  className="flex-1 bg-emerald-500 text-white py-4 rounded-xl font-bold disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 'confirm' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-center mb-6">
              <span className="text-5xl">📋</span>
              <h2 className="text-xl font-bold text-gray-800 mt-4">تأكيد التحويل</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">إلى</span>
                <span className="font-bold" dir="ltr">{recipientPhone}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">المبلغ</span>
                <span className="font-bold text-emerald-600">{parseFloat(amount).toLocaleString('ar-EG')} ج.م</span>
              </div>
              {description && (
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">ملاحظة</span>
                  <span>{description}</span>
                </div>
              )}
              <div className="flex justify-between py-3">
                <span className="text-gray-600">الرسوم</span>
                <span className="text-emerald-600">مجاناً</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStep('pin'); setPin(''); }}
                className="flex-1 py-4 border border-gray-300 rounded-xl font-bold text-gray-700"
              >
                رجوع
              </button>
              <button
                onClick={handleConfirm}
                disabled={sending}
                className="flex-1 bg-emerald-500 text-white py-4 rounded-xl font-bold disabled:opacity-50"
              >
                {sending ? 'جاري التحويل...' : 'تأكيد'}
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {step === 'success' && result && (
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <span className="text-6xl">✅</span>
            <h2 className="text-2xl font-bold text-emerald-600 mt-4">تم التحويل بنجاح!</h2>
            
            <div className="my-6 py-6 border-y">
              <p className="text-4xl font-bold text-gray-800">
                {parseFloat(amount).toLocaleString('ar-EG')} ج.م
              </p>
              <p className="text-gray-500 mt-2">
                إلى {result.transaction?.recipientName || recipientPhone}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold"
              >
                العودة للرئيسية
              </button>
              <button
                onClick={resetForm}
                className="w-full text-emerald-600 py-2 font-medium"
              >
                تحويل آخر
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <span className="text-6xl">❌</span>
            <h2 className="text-2xl font-bold text-red-600 mt-4">فشل التحويل</h2>
            <p className="text-gray-600 mt-2">{error}</p>

            <div className="mt-6 space-y-3">
              <button
                onClick={resetForm}
                className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold"
              >
                المحاولة مرة أخرى
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full text-gray-600 py-2"
              >
                العودة للرئيسية
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
