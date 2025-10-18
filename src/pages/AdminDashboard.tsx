import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, Users, Package, TrendingUp, MapPin, User, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';

interface Delivery {
  id: string;
  pickup_address: string;
  delivery_address: string;
  status: 'pending' | 'assigned' | 'on_route' | 'delivered' | 'cancelled';
  customer_id: string;
  driver_id: string | null;
  vehicle_id: string | null;
  package_details: string | null;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
}

interface Driver {
  user_id: string;
  full_name: string;
  email: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalDrivers: 0,
    activeDeliveries: 0,
    completedToday: 0,
  });
  const [pendingDeliveries, setPendingDeliveries] = useState<Delivery[]>([]);
  const [allDeliveries, setAllDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchPendingDeliveries();
    fetchAllDeliveries();
    fetchDrivers();
  }, []);

  const fetchStats = async () => {
    const [vehicles, drivers, deliveries] = await Promise.all([
      supabase.from('vehicles').select('id', { count: 'exact' }),
      supabase.from('user_roles').select('id', { count: 'exact' }).eq('role', 'driver'),
      supabase.from('deliveries').select('id, status', { count: 'exact' }),
    ]);

    const activeCount = deliveries.data?.filter(
      d => d.status === 'assigned' || d.status === 'on_route'
    ).length || 0;

    const completedCount = deliveries.data?.filter(
      d => d.status === 'delivered'
    ).length || 0;

    setStats({
      totalVehicles: vehicles.count || 0,
      totalDrivers: drivers.count || 0,
      activeDeliveries: activeCount,
      completedToday: completedCount,
    });
  };

  const fetchPendingDeliveries = async () => {
    const { data: deliveriesData, error } = await supabase
      .from('deliveries')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load pending deliveries');
      return;
    }

    // Fetch customer profiles for each delivery
    const deliveriesWithProfiles = await Promise.all(
      (deliveriesData || []).map(async (delivery) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', delivery.customer_id)
          .single();

        return {
          ...delivery,
          customer_name: profile?.full_name,
          customer_email: profile?.email,
        };
      })
    );

    setPendingDeliveries(deliveriesWithProfiles);
  };

  const fetchAllDeliveries = async () => {
    const { data: deliveriesData, error } = await supabase
      .from('deliveries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      toast.error('Failed to load deliveries');
      return;
    }

    // Fetch customer profiles for each delivery
    const deliveriesWithProfiles = await Promise.all(
      (deliveriesData || []).map(async (delivery) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', delivery.customer_id)
          .single();

        return {
          ...delivery,
          customer_name: profile?.full_name,
          customer_email: profile?.email,
        };
      })
    );

    setAllDeliveries(deliveriesWithProfiles);
  };

  const fetchDrivers = async () => {
    const { data: rolesData, error } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'driver');

    if (error) {
      toast.error('Failed to load drivers');
      return;
    }

    // Fetch profiles for each driver
    const driversWithProfiles = await Promise.all(
      (rolesData || []).map(async (role) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', role.user_id)
          .single();

        return {
          user_id: role.user_id,
          full_name: profile?.full_name || 'Unknown',
          email: profile?.email || '',
        };
      })
    );

    setDrivers(driversWithProfiles);
  };

  const assignDriver = async (deliveryId: string, driverId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('deliveries')
      .update({ 
        driver_id: driverId,
        status: 'assigned' as const
      })
      .eq('id', deliveryId);

    setLoading(false);

    if (error) {
      toast.error('Failed to assign driver: ' + error.message);
    } else {
      toast.success('Driver assigned successfully');
      fetchPendingDeliveries();
      fetchAllDeliveries();
      fetchStats();
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, status: 'cancelled') => {
    setLoading(true);
    const { error } = await supabase
      .from('deliveries')
      .update({ status })
      .eq('id', deliveryId);

    setLoading(false);

    if (error) {
      toast.error('Failed to update status: ' + error.message);
    } else {
      toast.success('Status updated successfully');
      fetchPendingDeliveries();
      fetchAllDeliveries();
      fetchStats();
    }
  };

  const statCards = [
    {
      title: 'Total Vehicles',
      value: stats.totalVehicles,
      icon: Truck,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Active Drivers',
      value: stats.totalDrivers,
      icon: Users,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: 'Active Deliveries',
      value: stats.activeDeliveries,
      icon: Package,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Completed Today',
      value: stats.completedToday,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Header />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage deliveries, assign drivers, and oversee operations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pending Deliveries - Need Driver Assignment */}
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Pending Deliveries - Assign Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingDeliveries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No pending deliveries</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingDeliveries.map((delivery) => (
                  <Card key={delivery.id} className="border-border/30">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={delivery.status} />
                            <span className="text-sm text-muted-foreground">
                              Order #{delivery.id.slice(0, 8)}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-info mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium">Pickup</p>
                                <p className="text-sm text-muted-foreground">{delivery.pickup_address}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-success mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium">Delivery</p>
                                <p className="text-sm text-muted-foreground">{delivery.delivery_address}</p>
                              </div>
                            </div>
                            {delivery.customer_name && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <p className="text-sm">
                                  Customer: <span className="font-medium">{delivery.customer_name}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full lg:w-auto">
                          <Select onValueChange={(driverId) => assignDriver(delivery.id, driverId)}>
                            <SelectTrigger className="w-full lg:w-[250px]">
                              <SelectValue placeholder="Assign Driver" />
                            </SelectTrigger>
                            <SelectContent>
                              {drivers.map((driver) => (
                                <SelectItem key={driver.user_id} value={driver.user_id}>
                                  {driver.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateDeliveryStatus(delivery.id, 'cancelled')}
                            disabled={loading}
                            className="w-full lg:w-auto"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel Order
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Deliveries Overview */}
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allDeliveries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No deliveries yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-4 border border-border/30 rounded-lg hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <StatusBadge status={delivery.status} />
                        <span className="text-sm text-muted-foreground">
                          #{delivery.id.slice(0, 8)}
                        </span>
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">From:</span> {delivery.pickup_address}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">To:</span> {delivery.delivery_address}
                      </p>
                      {delivery.customer_name && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Customer: {delivery.customer_name}
                        </p>
                      )}
                    </div>
                    
                    {delivery.status === 'assigned' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateDeliveryStatus(delivery.id, 'cancelled')}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
