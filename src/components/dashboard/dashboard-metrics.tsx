'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Users, TrendingUp, Activity, Eye, MousePointer } from "lucide-react";
import { useEffect, useState } from "react";

interface Metrics {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalContacts: number;
  openRate: number;
  clickRate: number;
  activeCampaigns: number;
  recentEvents: number;
}

export const DashboardMetrics = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalContacts: 0,
    openRate: 0,
    clickRate: 0,
    activeCampaigns: 0,
    recentEvents: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Simulate API call - in real app, fetch from Supabase
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setMetrics({
          totalSent: 15420,
          totalOpened: 8934,
          totalClicked: 2156,
          totalContacts: 5432,
          openRate: 58.2,
          clickRate: 14.1,
          activeCampaigns: 8,
          recentEvents: 147
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const metricCards = [
    {
      title: "Emails Enviados",
      value: metrics.totalSent.toLocaleString(),
      description: "Total en los últimos 30 días",
      icon: Mail,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+12.5%"
    },
    {
      title: "Tasa de Apertura",
      value: `${metrics.openRate}%`,
      description: `${metrics.totalOpened.toLocaleString()} emails abiertos`,
      icon: Eye,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+3.2%"
    },
    {
      title: "Tasa de Clics",
      value: `${metrics.clickRate}%`,
      description: `${metrics.totalClicked.toLocaleString()} clics registrados`,
      icon: MousePointer,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+1.8%"
    },
    {
      title: "Contactos Activos",
      value: metrics.totalContacts.toLocaleString(),
      description: "Base de datos total",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "+5.4%"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {metric.value}
                  </p>
                  <p className="text-xs text-gray-500">
                    {metric.description}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <IconComponent className={`w-6 h-6 ${metric.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm font-medium text-green-600">
                  {metric.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  vs. mes anterior
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}; 