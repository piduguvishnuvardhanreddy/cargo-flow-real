import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Truck, Package, Users, MapPin, Shield, Zap } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && role) {
      // Redirect to appropriate dashboard based on role
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'driver') {
        navigate('/driver');
      } else if (role === 'customer') {
        navigate('/customer');
      }
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Truck className="w-12 h-12 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-info/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-primary">
              <Truck className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              FleetFlow
            </h1>
          </div>
          <Button onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-primary shadow-glow mb-6">
            <Truck className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold leading-tight">
            Modern Logistics &{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Fleet Management
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time tracking, intelligent routing, and seamless delivery management 
            for businesses of all sizes.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Get Started
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Powerful Features</h3>
          <p className="text-muted-foreground">Everything you need to manage your fleet efficiently</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: MapPin,
              title: 'Real-Time Tracking',
              description: 'Track all deliveries and vehicles in real-time with GPS integration',
              color: 'text-primary',
              bg: 'bg-primary/10',
            },
            {
              icon: Package,
              title: 'Smart Scheduling',
              description: 'Intelligent conflict detection and optimized route planning',
              color: 'text-info',
              bg: 'bg-info/10',
            },
            {
              icon: Users,
              title: 'Role-Based Access',
              description: 'Separate dashboards for admins, drivers, and customers',
              color: 'text-success',
              bg: 'bg-success/10',
            },
            {
              icon: Shield,
              title: 'Secure & Reliable',
              description: 'Enterprise-grade security with end-to-end encryption',
              color: 'text-warning',
              bg: 'bg-warning/10',
            },
            {
              icon: Zap,
              title: 'Instant Updates',
              description: 'Real-time notifications for all delivery status changes',
              color: 'text-destructive',
              bg: 'bg-destructive/10',
            },
            {
              icon: Truck,
              title: 'Fleet Management',
              description: 'Comprehensive vehicle and driver management tools',
              color: 'text-primary',
              bg: 'bg-primary/10',
            },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="p-6 rounded-2xl border border-border/50 bg-card shadow-md hover:shadow-lg transition-all"
              >
                <div className={`inline-flex p-3 rounded-xl ${feature.bg} mb-4`}>
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="rounded-3xl bg-gradient-primary p-12 text-center shadow-glow">
          <h3 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Logistics?
          </h3>
          <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using FleetFlow to streamline their delivery operations.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate('/auth')}
            className="shadow-lg"
          >
            Start Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 FleetFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
