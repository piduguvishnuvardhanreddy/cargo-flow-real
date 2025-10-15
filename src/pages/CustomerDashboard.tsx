import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, MapPin } from 'lucide-react';

interface Delivery {
  id: string;
  pickup_address: string;
  delivery_address: string;
  status: 'pending' | 'assigned' | 'on_route' | 'delivered' | 'cancelled';
  created_at: string;
  package_details: string | null;
}

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => {
    if (user) {
      fetchDeliveries();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel('deliveries-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'deliveries',
            filter: `customer_id=eq.${user.id}`,
          },
          () => {
            fetchDeliveries();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchDeliveries = async () => {
    const { data } = await supabase
      .from('deliveries')
      .select('*')
      .eq('customer_id', user?.id)
      .order('created_at', { ascending: false });

    setDeliveries(data || []);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Deliveries</h1>
          <p className="text-muted-foreground">Track and manage your shipments</p>
        </div>
        <Button onClick={() => navigate('/new-delivery')}>
          <Plus className="w-4 h-4 mr-2" />
          New Delivery
        </Button>
      </div>

      <div className="grid gap-4">
        {deliveries.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No deliveries yet</p>
              <Button onClick={() => navigate('/new-delivery')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Delivery
              </Button>
            </CardContent>
          </Card>
        ) : (
          deliveries.map((delivery) => (
            <Card
              key={delivery.id}
              className="border-border/50 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/tracking/${delivery.id}`)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Delivery #{delivery.id.slice(0, 8)}
                  </CardTitle>
                  <StatusBadge status={delivery.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">From</p>
                    <p className="text-sm text-muted-foreground">{delivery.pickup_address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">To</p>
                    <p className="text-sm text-muted-foreground">{delivery.delivery_address}</p>
                  </div>
                </div>
                {delivery.package_details && (
                  <p className="text-sm text-muted-foreground">
                    {delivery.package_details}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(delivery.created_at).toLocaleDateString()}
                  </p>
                  <Button variant="ghost" size="sm">
                    Track →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
