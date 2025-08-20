import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";

interface AppointmentStatsData {
  total_appointments: number;
  upcoming_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
}

export const AppointmentStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AppointmentStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_appointment_stats', { patient_user_id: user.id });

      if (error) {
        console.error('Error fetching appointment stats:', error);
        return;
      }

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-8 bg-muted rounded mb-2"></div>
              <div className="h-6 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statsItems = [
    {
      title: "Total de Citas",
      value: stats.total_appointments,
      icon: Calendar,
      color: "text-primary",
      description: "Citas registradas"
    },
    {
      title: "Próximas Citas",
      value: stats.upcoming_appointments,
      icon: Clock,
      color: "text-blue-600",
      description: "Citas programadas"
    },
    {
      title: "Citas Completadas",
      value: stats.completed_appointments,
      icon: CheckCircle,
      color: "text-green-600",
      description: "Citas finalizadas"
    },
    {
      title: "Citas Canceladas",
      value: stats.cancelled_appointments,
      icon: XCircle,
      color: "text-red-600",
      description: "Citas canceladas"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statsItems.map((item) => (
        <Card key={item.title} className="hover:shadow-hover transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {item.title}
            </CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${item.color}`}>
              {item.value}
            </div>
            <CardDescription className="text-xs">
              {item.description}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};