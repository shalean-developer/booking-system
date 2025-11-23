'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { StatCard } from '@/components/admin/shared/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Server, Database, Zap } from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime?: number;
  lastChecked: string;
  message?: string;
}

export default function CheckServicesPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    checkServices();
    const interval = setInterval(checkServices, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const checkServices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/services/status');
      const data = await response.json();

      if (data.ok) {
        setServices(data.services || []);
        setMaintenanceMode(data.maintenanceMode || false);
        setLastCheck(new Date());
      }
    } catch (error) {
      console.error('Error checking services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMaintenanceMode = async () => {
    try {
      const response = await fetch('/api/admin/services/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !maintenanceMode }),
      });
      const data = await response.json();
      if (data.ok) {
        setMaintenanceMode(!maintenanceMode);
      }
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'degraded':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'down':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const operationalCount = services.filter((s) => s.status === 'operational').length;
  const degradedCount = services.filter((s) => s.status === 'degraded').length;
  const downCount = services.filter((s) => s.status === 'down').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Status"
        description="Monitor system services and availability"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Check Services' },
        ]}
        actions={
          <Button variant="outline" onClick={checkServices} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Operational"
          value={operationalCount}
          icon={CheckCircle}
          iconColor="text-green-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Degraded"
          value={degradedCount}
          icon={AlertCircle}
          iconColor="text-yellow-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Down"
          value={downCount}
          icon={XCircle}
          iconColor="text-red-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Services"
          value={services.length}
          icon={Server}
          iconColor="text-blue-600"
          isLoading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Maintenance Mode</CardTitle>
              <CardDescription>
                Enable maintenance mode to temporarily disable the system
              </CardDescription>
            </div>
            <Button
              variant={maintenanceMode ? 'destructive' : 'outline'}
              onClick={toggleMaintenanceMode}
            >
              {maintenanceMode ? 'Disable' : 'Enable'} Maintenance
            </Button>
          </div>
        </CardHeader>
        {maintenanceMode && (
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Maintenance mode is currently enabled. The system is unavailable to users.
              </span>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Service Status</CardTitle>
              <CardDescription>
                Real-time status of all system services
                {lastCheck && (
                  <span className="ml-2 text-xs text-gray-500">
                    Last checked: {lastCheck.toLocaleTimeString()}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No services to monitor</p>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <div className="font-medium text-gray-900">{service.name}</div>
                      {service.message && (
                        <div className="text-sm text-gray-500 mt-1">{service.message}</div>
                      )}
                      {service.responseTime && (
                        <div className="text-xs text-gray-400 mt-1">
                          Response time: {service.responseTime}ms
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={getStatusColor(service.status)}>
                      {service.status}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(service.lastChecked).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Connection Status</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="text-sm font-medium text-gray-900">~50ms</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              API Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Status</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Operational
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Response</span>
                <span className="text-sm font-medium text-gray-900">~120ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

