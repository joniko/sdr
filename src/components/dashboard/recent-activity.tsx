'use client';

import { Badge } from "@/components/ui/badge";
import { Mail, Eye, MousePointer, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ActivityEvent {
  id: string;
  type: 'sent' | 'opened' | 'clicked' | 'bounced' | 'delivered' | 'failed';
  email: string;
  subject: string;
  timestamp: string;
  campaign?: string;
}

export const RecentActivity = () => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        // Simulate API call - in real app, fetch from Supabase
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockActivities: ActivityEvent[] = [
          {
            id: '1',
            type: 'clicked',
            email: 'usuario@example.com',
            subject: 'Nuevas funcionalidades disponibles',
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            campaign: 'Newsletter Marzo'
          },
          {
            id: '2',
            type: 'opened',
            email: 'cliente@empresa.com',
            subject: 'Tu pedido está en camino',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            campaign: 'Confirmaciones'
          },
          {
            id: '3',
            type: 'delivered',
            email: 'maria@startup.co',
            subject: 'Invitación especial para ti',
            timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
            campaign: 'Promociones'
          },
          {
            id: '4',
            type: 'sent',
            email: 'juan@tech.com',
            subject: 'Resumen semanal de actividad',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            campaign: 'Reportes'
          },
          {
            id: '5',
            type: 'bounced',
            email: 'invalid@domain.xyz',
            subject: 'Bienvenido a nuestra plataforma',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            campaign: 'Onboarding'
          },
          {
            id: '6',
            type: 'opened',
            email: 'ana@design.co',
            subject: 'Nuevos templates disponibles',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            campaign: 'Producto'
          }
        ];
        
        setActivities(mockActivities);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'sent':
        return Mail;
      case 'opened':
        return Eye;
      case 'clicked':
        return MousePointer;
      case 'delivered':
        return CheckCircle;
      case 'bounced':
      case 'failed':
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const getEventColor = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'opened':
        return 'bg-green-100 text-green-800';
      case 'clicked':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      case 'bounced':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventText = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'sent':
        return 'Enviado';
      case 'opened':
        return 'Abierto';
      case 'clicked':
        return 'Clic';
      case 'delivered':
        return 'Entregado';
      case 'bounced':
        return 'Rebotado';
      case 'failed':
        return 'Falló';
      default:
        return 'Evento';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center space-x-3">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const IconComponent = getEventIcon(activity.type);
        const timeAgo = formatDistanceToNow(new Date(activity.timestamp), { 
          locale: es, 
          addSuffix: true 
        });

        return (
          <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className={`p-2 rounded-full ${getEventColor(activity.type).replace('text-', 'bg-').replace('100', '200')}`}>
              <IconComponent className={`w-4 h-4 ${getEventColor(activity.type).split(' ')[1]}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.subject}
                </p>
                <Badge variant="secondary" className={getEventColor(activity.type)}>
                  {getEventText(activity.type)}
                </Badge>
              </div>
              
              <p className="text-xs text-gray-600 truncate">
                {activity.email}
              </p>
              
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  {timeAgo}
                </p>
                {activity.campaign && (
                  <p className="text-xs text-blue-600 font-medium">
                    {activity.campaign}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
      
      <div className="pt-4 border-t">
        <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
          Ver toda la actividad →
        </button>
      </div>
    </div>
  );
}; 