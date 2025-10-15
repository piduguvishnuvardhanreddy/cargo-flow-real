import { Badge } from "@/components/ui/badge";
import { Truck, Package, CheckCircle2, XCircle, Clock } from "lucide-react";

type DeliveryStatus = 'pending' | 'assigned' | 'on_route' | 'delivered' | 'cancelled';

interface StatusBadgeProps {
  status: DeliveryStatus;
  showIcon?: boolean;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-muted text-muted-foreground border-border',
    icon: Clock,
  },
  assigned: {
    label: 'Assigned',
    className: 'bg-info/10 text-info border-info/20',
    icon: Package,
  },
  on_route: {
    label: 'On Route',
    className: 'bg-primary/10 text-primary border-primary/20',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: XCircle,
  },
};

export const StatusBadge = ({ status, showIcon = true }: StatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} font-medium`}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
};
