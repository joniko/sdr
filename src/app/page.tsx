import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Users, TrendingUp, Activity } from "lucide-react";
import Link from "next/link";
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { CampaignOverview } from "@/components/dashboard/campaign-overview";
import { EmailPerformanceChart } from "@/components/dashboard/email-performance-chart";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Email Workflow Intelligence
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Automatiza y optimiza tus campañas de email con IA
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/campaigns/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Campaña
              </Button>
            </Link>
            <Link href="/templates/new">
              <Button variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Nuevo Template
              </Button>
            </Link>
          </div>
        </div>

        {/* Metrics Overview */}
        <Suspense fallback={<MetricsSkeleton />}>
          <DashboardMetrics />
        </Suspense>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left Column - Charts and Performance */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Rendimiento de Email
                </CardTitle>
                <CardDescription>
                  Métricas de tus campañas en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<ChartSkeleton />}>
                  <EmailPerformanceChart />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Campañas Activas
                </CardTitle>
                <CardDescription>
                  Resumen de tus campañas en curso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<TableSkeleton />}>
                  <CampaignOverview />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity and Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Actividad Reciente
                </CardTitle>
                <CardDescription>
                  Últimos eventos de tus emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<ActivitySkeleton />}>
                  <RecentActivity />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/contacts">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Gestionar Contactos
                  </Button>
                </Link>
                <Link href="/templates">
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Ver Templates
                  </Button>
                </Link>
                <Link href="/automation">
                  <Button variant="outline" className="w-full justify-start">
                    <Activity className="w-4 h-4 mr-2" />
                    Configurar Automatización
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Feature Highlight */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-800">🤖 IA Inteligente</CardTitle>
                <CardDescription className="text-purple-600">
                  Nuestro sistema adapta automáticamente el contenido según los eventos detectados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    Adaptación de Copy
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Optimización de Asuntos
                  </Badge>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Pre-headers Dinámicos
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading skeletons
const MetricsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(4)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const ChartSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-64 bg-gray-200 rounded"></div>
  </div>
);

const TableSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-12 bg-gray-200 rounded"></div>
    ))}
  </div>
);

const ActivitySkeleton = () => (
  <div className="animate-pulse space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center space-x-3">
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);
