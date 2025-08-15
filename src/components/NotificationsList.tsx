import { useNotifications } from "@/hooks/useNotifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MedicalButton } from "@/components/ui/medical-button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, Calendar, Star, AlertCircle, Check } from "lucide-react";

export const NotificationsList = () => {
  const { notifications, markAsRead, loading } = useNotifications();
  const { toast } = useToast();

  const handleMarkAsRead = async (notificationId: string) => {
    const { error } = await markAsRead(notificationId);
    
    if (error) {
      toast({
        title: "Error",
        description: "No se pudo marcar la notificación como leída",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      'appointment_reminder': Calendar,
      'appointment_confirmation': Check,
      'review_request': Star,
      'general': Bell,
    };
    
    const IconComponent = icons[type as keyof typeof icons] || Bell;
    return <IconComponent className="h-5 w-5" />;
  };

  const getNotificationColor = (type: string) => {
    const colors = {
      'appointment_reminder': 'text-primary',
      'appointment_confirmation': 'text-success',
      'review_request': 'text-warning',
      'general': 'text-muted-foreground',
    };
    
    return colors[type as keyof typeof colors] || 'text-muted-foreground';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Hace unos minutos';
    } else if (diffInHours < 24) {
      return `Hace ${Math.floor(diffInHours)} hora${Math.floor(diffInHours) > 1 ? 's' : ''}`;
    } else if (diffInHours < 48) {
      return 'Hace 1 día';
    } else {
      return `Hace ${Math.floor(diffInHours / 24)} días`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-muted-foreground">Cargando notificaciones...</div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No tienes notificaciones
          </h3>
          <p className="text-muted-foreground text-center">
            Las notificaciones aparecerán aquí cuando tengas actualizaciones
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <Card 
          key={notification.id} 
          className={`hover:shadow-hover transition-shadow ${
            !notification.read_at ? 'border-primary/20 bg-primary/5' : ''
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`mt-0.5 ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {notification.title}
                    {!notification.read_at && (
                      <Badge variant="default" className="text-xs">
                        Nuevo
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {notification.message}
                  </CardDescription>
                </div>
              </div>
              
              {!notification.read_at && (
                <MedicalButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <Check className="h-4 w-4" />
                </MedicalButton>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatDate(notification.created_at)}
              </span>
              
              {notification.read_at && (
                <span className="text-xs text-muted-foreground">
                  Leído {formatDate(notification.read_at)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};