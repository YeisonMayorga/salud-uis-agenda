import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MedicalButton } from "@/components/ui/medical-button";
import { Calendar, Clock, User, History, Bell, Star } from "lucide-react";
import saludUisLogo from "@/assets/salud-uis-logo.png";

const Dashboard = () => {
  const { user, signOut } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const quickActions = [
    {
      title: "Agendar Cita",
      description: "Solicita una nueva cita médica",
      icon: Calendar,
      action: () => console.log("Agendar cita"),
      variant: "medical" as const,
    },
    {
      title: "Mis Citas",
      description: "Ver citas programadas",
      icon: Clock,
      action: () => console.log("Ver citas"),
      variant: "outline" as const,
    },
    {
      title: "Historial",
      description: "Ver historial de citas",
      icon: History,
      action: () => console.log("Ver historial"),
      variant: "outline" as const,
    },
    {
      title: "Mi Perfil",
      description: "Editar información personal",
      icon: User,
      action: () => console.log("Ver perfil"),
      variant: "outline" as const,
    },
  ];

  const upcomingAppointments = [
    {
      id: 1,
      doctor: "Dr. Carlos Mendoza",
      specialty: "Medicina General",
      date: "2024-01-15",
      time: "10:00 AM",
      status: "confirmada",
    },
    {
      id: 2,
      doctor: "Dra. Ana García",
      specialty: "Cardiología",
      date: "2024-01-20",
      time: "2:30 PM",
      status: "programada",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Header */}
      <header className="bg-card shadow-card border-b border-primary/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={saludUisLogo} alt="Salud UIS" className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-primary">Salud UIS</h1>
              <p className="text-sm text-muted-foreground">Portal del Paciente</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">¡Bienvenido!</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <MedicalButton 
              variant="outline" 
              size="sm" 
              onClick={signOut}
            >
              Cerrar Sesión
            </MedicalButton>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary mb-2">
            ¡Bienvenido a tu Portal Médico!
          </h2>
          <p className="text-muted-foreground">
            Gestiona tus citas médicas de forma fácil y segura
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Card 
                key={index} 
                className="hover:shadow-hover transition-all duration-300 cursor-pointer border-primary/10"
                onClick={action.action}
              >
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-2 p-3 bg-primary/10 rounded-full w-fit">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <MedicalButton 
                    variant={action.variant} 
                    className="w-full"
                    size="sm"
                  >
                    Acceder
                  </MedicalButton>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Próximas Citas */}
          <Card className="shadow-card border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <Clock className="h-5 w-5 mr-2" />
                Próximas Citas
              </CardTitle>
              <CardDescription>
                Tus citas médicas programadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div 
                      key={appointment.id}
                      className="p-4 bg-secondary rounded-lg border border-primary/10"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-foreground">
                          {appointment.doctor}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'confirmada' 
                            ? 'bg-success text-success-foreground' 
                            : 'bg-warning text-warning-foreground'
                        }`}>
                          {appointment.status === 'confirmada' ? 'Confirmada' : 'Programada'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {appointment.specialty}
                      </p>
                      <p className="text-sm font-medium text-primary">
                        {appointment.date} a las {appointment.time}
                      </p>
                    </div>
                  ))}
                  <MedicalButton variant="outline" className="w-full" size="sm">
                    Ver todas las citas
                  </MedicalButton>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tienes citas programadas</p>
                  <MedicalButton variant="medical" className="mt-4" size="sm">
                    Agendar primera cita
                  </MedicalButton>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notificaciones y Recordatorios */}
          <Card className="shadow-card border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <Bell className="h-5 w-5 mr-2" />
                Notificaciones
              </CardTitle>
              <CardDescription>
                Recordatorios y actualizaciones importantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-accent rounded-lg border border-primary/10">
                  <div className="flex items-start space-x-3">
                    <Bell className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">
                        Recordatorio de Cita
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Tienes una cita mañana con Dr. Carlos Mendoza a las 10:00 AM
                      </p>
                      <span className="text-xs text-primary">Hace 2 horas</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-secondary rounded-lg border border-primary/10">
                  <div className="flex items-start space-x-3">
                    <Star className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">
                        Califica tu consulta
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        ¿Cómo fue tu experiencia con Dra. Ana García?
                      </p>
                      <span className="text-xs text-primary">Hace 1 día</span>
                    </div>
                  </div>
                </div>
                
                <MedicalButton variant="ghost" className="w-full" size="sm">
                  Ver todas las notificaciones
                </MedicalButton>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;