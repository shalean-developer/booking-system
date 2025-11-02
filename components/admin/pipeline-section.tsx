'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, FileText, UserCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface PipelineSectionProps {
  stats?: {
    quotes?: {
      total?: number;
      pending?: number;
      contacted?: number;
      converted?: number;
      oldPending?: number;
      oldPendingList?: Array<{
        id: string;
        name: string;
        email: string;
        created_at: string;
      }>;
    };
    applications?: {
      total?: number;
      pending?: number;
    };
    customers?: {
      total?: number;
      retentionRate?: number;
    };
  };
}

export function PipelineSection({ stats }: PipelineSectionProps) {
  const quotes = stats?.quotes || {};
  const applications = stats?.applications || {};
  const customers = stats?.customers || {};

  // Calculate conversion rate
  const conversionRate = quotes.total && quotes.total > 0
    ? Math.round((quotes.converted || 0) / quotes.total * 100)
    : 0;

  // Calculate applications rate
  const applicationRate = applications.total && applications.total > 0
    ? Math.round((applications.pending || 0) / applications.total * 100)
    : 0;

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Business Pipeline</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quotes Pipeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Quote Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">{quotes.total || 0}</div>
            
            {/* Pipeline Stages */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <span className="text-sm font-bold text-yellow-700">{quotes.pending || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Contacted</span>
                </div>
                <span className="text-sm font-bold text-blue-700">{quotes.contacted || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Converted</span>
                </div>
                <span className="text-sm font-bold text-green-700">{quotes.converted || 0}</span>
              </div>
            </div>

            {quotes.total && quotes.total > 0 && (
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Conversion Rate</span>
                  <span className="font-semibold">{conversionRate}%</span>
                </div>
              </div>
            )}

            {quotes.oldPending && quotes.oldPending > 0 && (
              <div className="pt-3">
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                  <AlertCircle className="h-3 w-3" />
                  <span>{quotes.oldPending} quotes need follow-up</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Applications Pipeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Cleaner Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">{applications.total || 0}</div>
            
            <div className="space-y-3">
              <div className={`flex items-center justify-between p-2 rounded-lg border ${
                applications.pending && applications.pending > 0
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertCircle className={`h-4 w-4 ${applications.pending && applications.pending > 0 ? 'text-orange-600' : 'text-gray-600'}`} />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <span className={`text-sm font-bold ${applications.pending && applications.pending > 0 ? 'text-orange-700' : 'text-gray-700'}`}>
                  {applications.pending || 0}
                </span>
              </div>

              {applications.total && applications.total > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Review Rate</span>
                    <span className="font-semibold">{applicationRate}%</span>
                  </div>
                </div>
              )}

              {applications.pending && applications.pending > 0 && (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'applications' }))}
                  className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium py-2 px-3 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  Review Applications →
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Customer Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">{customers.total || 0}</div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Retention Rate</span>
                </div>
                <span className="text-sm font-bold text-green-700">
                  {customers.retentionRate || 0}%
                </span>
              </div>

              <div className="pt-3 border-t">
                <div className="text-xs text-gray-600 mb-2">Customer Base</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${customers.retentionRate || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {customers.retentionRate && customers.retentionRate >= 70 && (
              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                <CheckCircle className="h-3 w-3" />
                <span>Healthy retention rate</span>
              </div>
            )}

            {customers.retentionRate && customers.retentionRate < 50 && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                <AlertCircle className="h-3 w-3" />
                <span>Low retention rate</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

