import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, Users, Package, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalDrivers: 0,
    activeDeliveries: 0,
    completedToday: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [vehicles, drivers, deliveries] = await Promise.all([
        supabase.from('vehicles').select('id', { count: 'exact' }),
        supabase.from('user_roles').select('id', { count: 'exact' }).eq('role', 'driver'),
        supabase.from('deliveries').select('id, status', { count: 'exact' }),
      ]);

      const activeCount = deliveries.data?.filter(
        d => d.status === 'assigned' || d.status === 'on_route'
      ).length || 0;

      const today = new Date().toISOString().split('T')[0];
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

    fetchStats();
  }, []);

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
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your fleet and deliveries</p>
        </div>
        <Button onClick={() => navigate('/vehicles')}>
          Manage Fleet
        </Button>
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

      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => navigate('/vehicles')}
          >
            <Truck className="w-6 h-6" />
            <span>Manage Vehicles</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => navigate('/deliveries')}
          >
            <Package className="w-6 h-6" />
            <span>View Deliveries</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => navigate('/tracking')}
          >
            <TrendingUp className="w-6 h-6" />
            <span>Live Tracking</span>
          </Button>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
