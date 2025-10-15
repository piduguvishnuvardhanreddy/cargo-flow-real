import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';
import { MapPin, Package, Navigation } from 'lucide-react';

interface Delivery {
  id: string;
  pickup_address: string;
  delivery_address: string;
  status: 'pending' | 'assigned' | 'on_route' | 'delivered' | 'cancelled';
  scheduled_pickup: string | null;
  package_details: string | null;
}

const DriverDashboard = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDeliveries();
    }
  }, [user]);

  const fetchDeliveries = async () => {
    const { data, error } = await supabase
      .from('deliveries')
      .select('*')
      .eq('driver_id', user?.id)
      .in('status', ['assigned', 'on_route'])
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load deliveries');
    } else {
      setDeliveries(data || []);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    setLoading(true);
    const updates: any = { status: newStatus };
    
    if (newStatus === 'on_route') {
      updates.actual_pickup = new Date().toISOString();
    } else if (newStatus === 'delivered') {
      updates.actual_delivery = new Date().toISOString();
    }

    const { error } = await supabase
      .from('deliveries')
      .update(updates)
      .eq('id', deliveryId);

    setLoading(false);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated successfully');
      fetchDeliveries();
    }
  };

  const startLocationSharing = async (deliveryId: string) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { error } = await supabase.from('tracking').insert({
            delivery_id: deliveryId,
            driver_id: user?.id,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });

          if (error) {
            toast.error('Failed to share location');
          } else {
            toast.success('Location shared');
          }
        },
        () => {
          toast.error('Please enable location access');
        }
      );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Driver Dashboard</h1>
        <p className="text-muted-foreground">Your assigned deliveries</p>
      </div>

      <div className="grid gap-4">
        {deliveries.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active deliveries</p>
            </CardContent>
          </Card>
        ) : (
          deliveries.map((delivery) => (
            <Card key={delivery.id} className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Delivery #{delivery.id.slice(0, 8)}</CardTitle>
                  <StatusBadge status={delivery.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-info mt-0.5" />
                    <div>
                      <p className="font-medium">Pickup</p>
                      <p className="text-sm text-muted-foreground">{delivery.pickup_address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Delivery</p>
                      <p className="text-sm text-muted-foreground">{delivery.delivery_address}</p>
                    </div>
                  </div>
                </div>

                {delivery.package_details && (
                  <div>
                    <p className="text-sm font-medium">Package Details</p>
                    <p className="text-sm text-muted-foreground">{delivery.package_details}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {delivery.status === 'assigned' && (
                    <>
                      <Button
                        onClick={() => updateDeliveryStatus(delivery.id, 'on_route')}
                        disabled={loading}
                        size="sm"
                      >
                        Start Delivery
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => startLocationSharing(delivery.id)}
                        size="sm"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Share Location
                      </Button>
                    </>
                  )}
                  {delivery.status === 'on_route' && (
                    <>
                      <Button
                        onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                        disabled={loading}
                        size="sm"
                        className="bg-success hover:bg-success/90"
                      >
                        Mark Delivered
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => startLocationSharing(delivery.id)}
                        size="sm"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Update Location
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
