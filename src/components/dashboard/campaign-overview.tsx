'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Play, Pause, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  totalSent: number;
  openRate: number;
  clickRate: number;
  lastActivity: string;
  created: string;
}

export const CampaignOverview = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        // Simulate API call - in real app, fetch from Supabase
        await new Promise(resolve => setTimeout(resolve, 900));
        
        const mockCampaigns: Campaign[] = [
          {
            id: '1',
            name: 'Newsletter Marzo 2024',
            status: 'active',
            totalSent: 5420,
            openRate: 62.3,
            clickRate: 18.7,
            lastActivity: '2024-03-15T10:30:00Z',
            created: '2024-03-01T09:00:00Z'
          },
          {
            id: '2',
            name: 'Promoción Primavera',
            status: 'active',
            totalSent: 3250,
            openRate: 58.9,
            clickRate: 22.1,
            lastActivity: '2024-03-15T08:15:00Z',
            created: '2024-03-10T14:30:00Z'
          },
          {
            id: '3',
            name: 'Onboarding Usuarios',
            status: 'active',
            totalSent: 890,
            openRate: 71.2,
            clickRate: 35.4,
            lastActivity: '2024-03-15T07:45:00Z',
            created: '2024-03-12T11:00:00Z'
          },
          {
            id: '4',
            name: 'Feedback Producto',
            status: 'paused',
            totalSent: 1200,
            openRate: 45.6,
            clickRate: 12.3,
            lastActivity: '2024-03-14T16:20:00Z',
            created: '2024-03-05T10:15:00Z'
          },
          {
            id: '5',
            name: 'Webinar Invitaciones',
            status: 'completed',
            totalSent: 2100,
            openRate: 68.4,
            clickRate: 28.9,
            lastActivity: '2024-03-13T19:30:00Z',
            created: '2024-03-08T13:45:00Z'
          }
        ];
        
        setCampaigns(mockCampaigns);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const getStatusBadge = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activa</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pausada</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completada</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Borrador</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Hace menos de 1h';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Hace ${diffInDays}d`;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaña</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Enviados</TableHead>
            <TableHead className="text-right">Apertura</TableHead>
            <TableHead className="text-right">Clics</TableHead>
            <TableHead className="text-right">Última Actividad</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id} className="hover:bg-gray-50">
              <TableCell>
                <div>
                  <p className="font-medium text-gray-900">{campaign.name}</p>
                  <p className="text-sm text-gray-500">
                    ID: {campaign.id}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(campaign.status)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {campaign.totalSent.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <span className={`font-medium ${
                    campaign.openRate > 60 ? 'text-green-600' : 
                    campaign.openRate > 40 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {campaign.openRate}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <span className={`font-medium ${
                    campaign.clickRate > 20 ? 'text-green-600' : 
                    campaign.clickRate > 10 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {campaign.clickRate}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right text-sm text-gray-500">
                {formatTimeAgo(campaign.lastActivity)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Link href={`/campaigns/${campaign.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  {campaign.status === 'active' ? (
                    <Button variant="ghost" size="sm">
                      <Pause className="w-4 h-4" />
                    </Button>
                  ) : campaign.status === 'paused' ? (
                    <Button variant="ghost" size="sm">
                      <Play className="w-4 h-4" />
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-gray-500">
          Mostrando {campaigns.length} de {campaigns.length} campañas
        </p>
        <Link href="/campaigns">
          <Button variant="outline">
            Ver todas las campañas
          </Button>
        </Link>
      </div>
    </div>
  );
}; 