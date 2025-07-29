'use client';

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChartData {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
}

export const EmailPerformanceChart = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Simulate API call - in real app, fetch from Supabase
        await new Promise(resolve => setTimeout(resolve, 700));
        
        // Generate mock data for the last 30 days
        const mockData: ChartData[] = [];
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          
          const sent = Math.floor(Math.random() * 500) + 200;
          const delivered = Math.floor(sent * (0.92 + Math.random() * 0.07));
          const opened = Math.floor(delivered * (0.45 + Math.random() * 0.25));
          const clicked = Math.floor(opened * (0.15 + Math.random() * 0.20));
          const bounced = sent - delivered;
          
          mockData.push({
            date: date.toISOString().split('T')[0],
            sent,
            delivered,
            opened,
            clicked,
            bounced
          });
        }
        
        setChartData(mockData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTooltipValue = (value: number, name: string) => {
    const labels: Record<string, string> = {
      sent: 'Enviados',
      delivered: 'Entregados',
      opened: 'Abiertos',
      clicked: 'Clics',
      bounced: 'Rebotados'
    };
    return [value.toLocaleString(), labels[name] || name];
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">
            {formatDate(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="h-96 animate-pulse bg-gray-200 rounded-lg"></div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="volume">Volumen</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends" className="space-y-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="opened" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Abiertos"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="clicked" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Clics"
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="bounced" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Rebotados"
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Emails Abiertos</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Clics Registrados</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Emails Rebotados</span>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="volume" className="space-y-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="sent" 
                  fill="#3b82f6" 
                  name="Enviados"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="delivered" 
                  fill="#10b981" 
                  name="Entregados"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Emails Enviados</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Emails Entregados</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 