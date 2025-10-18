'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/header';
import { createClient } from '@/lib/supabase-browser';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  TestTube
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SIMPLIFIED SIGNUP TEST PAGE
 * 
 * Purpose: Test if auth signup works WITHOUT metadata
 * This helps isolate if first_name/last_name is causing the issue
 * 
 * Test Results:
 * - ✅ If this works → Metadata is the problem
 * - ❌ If this fails → Database/RLS/Trigger issue
 */

export default function SignupTestPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [detailedLog, setDetailedLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setDetailedLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setDetailedLog([]);

    addLog('🔍 Starting simplified signup test...');
    addLog(`📧 Email: ${email}`);

    try {
      const supabase = createClient();
      
      addLog('🔌 Creating Supabase client...');
      addLog('📡 Calling supabase.auth.signUp()...');
      addLog('⚠️ NO METADATA - Testing without first_name/last_name');

      // SIMPLIFIED SIGNUP - NO METADATA
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        // NO options.data - this is the test!
        // Normal signup includes:
        // options: {
        //   data: { first_name: 'X', last_name: 'Y' }
        // }
      });

      if (authError) {
        addLog(`❌ Signup FAILED: ${authError.message}`);
        addLog(`📋 Error code: ${authError.status || 'unknown'}`);
        setError(authError.message);
        
        // Additional diagnostic info
        if (authError.message.includes('Database error')) {
          addLog('🔍 DATABASE ERROR detected!');
          addLog('💡 Check: Triggers, RLS policies, Webhooks');
          addLog('📖 See FIX_AUTH_DEBUG_CHECKLIST.md');
        }
        return;
      }

      addLog('✅ Signup SUCCESSFUL!');
      addLog(`👤 User ID: ${authData.user?.id}`);
      addLog(`📧 Email: ${authData.user?.email}`);
      addLog(`✉️ Confirmed: ${authData.user?.email_confirmed_at ? 'Yes' : 'No - check email'}`);

      // Determine result
      if (authData.user) {
        setSuccessMessage(
          `✅ SIMPLIFIED SIGNUP WORKS!\n\n` +
          `This means the issue is likely with METADATA (first_name, last_name).\n\n` +
          `User created: ${authData.user.id}`
        );
        addLog('💡 DIAGNOSIS: Metadata is causing the issue');
        addLog('📖 Solution: See "Fix Metadata Issue" in checklist');
      }

    } catch (err) {
      addLog(`💥 Exception: ${err instanceof Error ? err.message : 'Unknown'}`);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <Header variant="minimal" />

      {/* Test Page */}
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                <TestTube className="h-8 w-8 text-purple-600" />
              </div>
              <h1 className="mb-4 text-3xl md:text-4xl font-bold text-gray-900">
                🧪 Simplified Signup Test
              </h1>
              <p className="text-gray-600 text-sm md:text-base mb-4">
                Testing auth signup <strong>without metadata</strong>
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full text-sm text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <span>For debugging purposes only</span>
              </div>
            </div>

            {/* Info Box */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <h3 className="font-semibold text-blue-900 mb-2">🎯 What This Tests:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ If this works → Metadata (first_name/last_name) is the issue</li>
                <li>❌ If this fails → Database trigger/RLS/webhook is the issue</li>
              </ul>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
              {/* Success Message */}
              <AnimatePresence>
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 rounded-2xl bg-green-50 border-2 border-green-200 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-green-900 mb-1">
                          Test Result: SUCCESS ✅
                        </h3>
                        <p className="text-sm text-green-700 whitespace-pre-line">{successMessage}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 rounded-2xl bg-red-50 border-2 border-red-200 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-red-900 mb-1">
                          Test Result: FAILED ❌
                        </h3>
                        <p className="text-sm text-red-700 mb-2">{error}</p>
                        <p className="text-xs text-red-600">
                          → Check database triggers, RLS policies, or webhooks
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={onSubmit} className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-900">
                    Email Address (Test)
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="test@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 rounded-xl border-2 pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Use a unique email not previously registered
                  </p>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-900">
                    Password (Test)
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 rounded-xl border-2 pl-10"
                      required
                      disabled={isLoading}
                      minLength={8}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    'w-full rounded-full px-8 py-3 font-semibold shadow-lg h-12',
                    'bg-purple-600 hover:bg-purple-700 text-white',
                    'focus:ring-2 focus:ring-purple-300 focus:outline-none',
                    'transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Testing Signup...
                    </>
                  ) : (
                    <>
                      🧪 Test Simplified Signup
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              {/* Detailed Log */}
              {detailedLog.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    📋 Detailed Log:
                  </h3>
                  <div className="space-y-1 text-xs font-mono text-gray-700">
                    {detailedLog.map((log, idx) => (
                      <div key={idx} className="py-1 border-b border-gray-200 last:border-0">
                        {log}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">📖 Next Steps:</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <div>
                  <strong>If Test Succeeds ✅:</strong>
                  <p className="ml-4">→ Remove metadata from normal signup temporarily</p>
                  <p className="ml-4">→ Or store first_name/last_name in customer profile instead</p>
                </div>
                <div>
                  <strong>If Test Fails ❌:</strong>
                  <p className="ml-4">→ Run SQL diagnostics: <code>supabase/debug-auth-triggers.sql</code></p>
                  <p className="ml-4">→ Follow checklist: <code>FIX_AUTH_DEBUG_CHECKLIST.md</code></p>
                  <p className="ml-4">→ Check for database triggers, webhooks, or RLS policies</p>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="mt-6 text-center space-y-2">
              <Link
                href="/signup"
                className="text-sm text-purple-600 hover:underline block"
              >
                ← Back to Normal Signup
              </Link>
              <Link
                href="/"
                className="text-sm text-gray-600 hover:underline block"
              >
                Home
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

