// =============================================================================
// HEALTHPAY - SET PIN PAGE
// 
// Allows users to set their transaction PIN
//
// File: apps/wallet-dashboard/app/settings/pin/page.tsx
// =============================================================================

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gql, useMutation, useQuery } from '@apollo/client';

// =============================================================================
// GRAPHQL
// =============================================================================

const HAS_PIN_SET = gql`
  query HasPinSet {
    hasPinSet
  }
`;

const SET_PIN = gql`
  mutation SetPin($input: SetPinInput!) {
    setPin(input: $input) {
      success
      message
    }
  }
`;

const CHANGE_PIN = gql`
  mutation ChangePin($input: ChangePinInput!) {
    changePin(input: $input) {
      success
      message
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
  label,
}: { 
  value: string; 
  onChange: (val: string) => void;
  length?: number;
  autoFocus?: boolean;
  label?: string;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;
    
    const newValue = value.split('');
    newValue[index] = digit;
    const result = newValue.join('').substring(0, length);
    onChange(result);

    // Auto-focus next input
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
    <div>
      {label && <label className="block text-gray-700 font-medium mb-2 text-center">{label}</label>}
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
    </div>
  );
}

// =============================================================================
// SET PIN FORM
// =============================================================================

function SetPinForm({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');

  const [setPin_mutation, { loading }] = useMutation(SET_PIN);

  const handlePinEntered = () => {
    if (pin.length !== 4) {
      setError('الرجاء إدخال 4 أرقام');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleConfirmPin = async () => {
    if (confirmPin !== pin) {
      setError('الرمز غير متطابق');
      setConfirmPin('');
      return;
    }

    try {
      const result = await setPin_mutation({
        variables: {
          input: { pin, confirmPin },
        },
      });

      if (result.data?.setPin?.success) {
        onSuccess();
      } else {
        setError(result.data?.setPin?.message || 'فشل في تعيين الرمز');
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-center">
          {error}
        </div>
      )}

      {step === 'enter' ? (
        <>
          <div className="text-center mb-6">
            <span className="text-6xl">🔐</span>
            <h2 className="text-xl font-bold text-gray-800 mt-4">إنشاء رمز PIN</h2>
            <p className="text-gray-500 mt-2">أدخل رمزاً من 4 أرقام لتأمين معاملاتك</p>
          </div>

          <PinInput 
            value={pin} 
            onChange={setPin} 
            autoFocus 
            label="الرمز السري"
          />

          <button
            onClick={handlePinEntered}
            disabled={pin.length !== 4}
            className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            التالي
          </button>
        </>
      ) : (
        <>
          <div className="text-center mb-6">
            <span className="text-6xl">✅</span>
            <h2 className="text-xl font-bold text-gray-800 mt-4">تأكيد الرمز</h2>
            <p className="text-gray-500 mt-2">أعد إدخال الرمز للتأكيد</p>
          </div>

          <PinInput 
            value={confirmPin} 
            onChange={setConfirmPin} 
            autoFocus 
            label="تأكيد الرمز"
          />

          <button
            onClick={handleConfirmPin}
            disabled={loading || confirmPin.length !== 4}
            className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-600 disabled:opacity-50"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ الرمز'}
          </button>

          <button
            onClick={() => { setStep('enter'); setConfirmPin(''); }}
            className="w-full text-gray-600 py-2 hover:text-emerald-600"
          >
            ← رجوع
          </button>
        </>
      )}
    </div>
  );
}

// =============================================================================
// CHANGE PIN FORM
// =============================================================================

function ChangePinForm({ onSuccess }: { onSuccess: () => void }) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [error, setError] = useState('');

  const [changePin_mutation, { loading }] = useMutation(CHANGE_PIN);

  const handleCurrentPin = () => {
    if (currentPin.length !== 4) {
      setError('الرجاء إدخال 4 أرقام');
      return;
    }
    setError('');
    setStep('new');
  };

  const handleNewPin = () => {
    if (newPin.length !== 4) {
      setError('الرجاء إدخال 4 أرقام');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (confirmNewPin !== newPin) {
      setError('الرمز الجديد غير متطابق');
      setConfirmNewPin('');
      return;
    }

    try {
      const result = await changePin_mutation({
        variables: {
          input: { currentPin, newPin, confirmNewPin },
        },
      });

      if (result.data?.changePin?.success) {
        onSuccess();
      } else {
        setError(result.data?.changePin?.message || 'فشل في تغيير الرمز');
      }
    } catch (e: any) {
      setError(e.message);
      if (e.message.includes('Current PIN')) {
        setStep('current');
        setCurrentPin('');
      }
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-center">
          {error}
        </div>
      )}

      {step === 'current' && (
        <>
          <div className="text-center mb-6">
            <span className="text-6xl">🔑</span>
            <h2 className="text-xl font-bold text-gray-800 mt-4">تغيير الرمز</h2>
            <p className="text-gray-500 mt-2">أدخل رمزك الحالي</p>
          </div>
          <PinInput value={currentPin} onChange={setCurrentPin} autoFocus label="الرمز الحالي" />
          <button
            onClick={handleCurrentPin}
            disabled={currentPin.length !== 4}
            className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold disabled:opacity-50"
          >
            التالي
          </button>
        </>
      )}

      {step === 'new' && (
        <>
          <div className="text-center mb-6">
            <span className="text-6xl">🔐</span>
            <h2 className="text-xl font-bold text-gray-800 mt-4">الرمز الجديد</h2>
            <p className="text-gray-500 mt-2">أدخل رمزك الجديد</p>
          </div>
          <PinInput value={newPin} onChange={setNewPin} autoFocus label="الرمز الجديد" />
          <button
            onClick={handleNewPin}
            disabled={newPin.length !== 4}
            className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold disabled:opacity-50"
          >
            التالي
          </button>
          <button onClick={() => setStep('current')} className="w-full text-gray-600 py-2">← رجوع</button>
        </>
      )}

      {step === 'confirm' && (
        <>
          <div className="text-center mb-6">
            <span className="text-6xl">✅</span>
            <h2 className="text-xl font-bold text-gray-800 mt-4">تأكيد الرمز الجديد</h2>
          </div>
          <PinInput value={confirmNewPin} onChange={setConfirmNewPin} autoFocus label="تأكيد الرمز" />
          <button
            onClick={handleConfirm}
            disabled={loading || confirmNewPin.length !== 4}
            className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold disabled:opacity-50"
          >
            {loading ? 'جاري الحفظ...' : 'تغيير الرمز'}
          </button>
          <button onClick={() => setStep('new')} className="w-full text-gray-600 py-2">← رجوع</button>
        </>
      )}
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function PinSettingsPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data, loading: checkingPin } = useQuery(HAS_PIN_SET, {
    skip: !isReady,
  });

  useEffect(() => {
    const token = localStorage.getItem('healthpay_token');
    if (!token) {
      router.push('/login');
      return;
    }
    setIsReady(true);
  }, [router]);

  const handleSuccess = () => {
    setSuccess(true);
    setTimeout(() => router.push('/dashboard'), 2000);
  };

  if (!isReady || checkingPin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <span className="text-6xl">✅</span>
          <h2 className="text-xl font-bold text-gray-800 mt-4">تم بنجاح!</h2>
          <p className="text-gray-500 mt-2">جاري التحويل للوحة التحكم...</p>
        </div>
      </div>
    );
  }

  const hasPin = data?.hasPinSet;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-6">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button onClick={() => router.back()} className="text-2xl">→</button>
          <h1 className="text-xl font-bold">{hasPin ? 'تغيير رمز PIN' : 'إنشاء رمز PIN'}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {hasPin ? (
            <ChangePinForm onSuccess={handleSuccess} />
          ) : (
            <SetPinForm onSuccess={handleSuccess} />
          )}
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4">
          <h3 className="font-bold text-blue-800 mb-2">💡 نصائح أمان</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• لا تشارك رمز PIN مع أي شخص</li>
            <li>• لا تستخدم أرقام سهلة مثل 1234</li>
            <li>• غير الرمز بشكل دوري</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
