import { useState } from "react";
import { useAppointments } from "@/hooks/useAppointments";
import { useDoctors } from "@/hooks/useDoctors";
import { useSpecialties } from "@/hooks/useSpecialties";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MedicalButton } from "@/components/ui/medical-button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, AlertCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface AppointmentsListProps {
  showHistory?: boolean;
}

export const AppointmentsList = ({ showHistory = false }: AppointmentsListProps) => {
  const { getUpcomingAppointments, getAppointmentHistory, cancelAppointment, loading } = useAppointments();
  const { doctors } = useDoctors();
  const { specialties } = useSpecialties();
  const { toast } = useToast();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const appointments = showHistory ? getAppointmentHistory() : getUpcomingAppointments();

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor?.full_name || "Profesional no encontrado";
  };

  const getSpecialtyName = (specialtyId: string) => {
    const specialty = specialties.find(s => s.id === specialtyId);
    return specialty?.name || "Especialidad no encontrada";
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    setCancellingId(appointmentId);
    
    const { error } = await cancelAppointment(appointmentId);
    
    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cancelar la cita. Intenta nuevamente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cita cancelada",
        description: "Tu cita ha sido cancelada exitosamente",
      });
    }
    
    setCancellingId(null);
  };

  const canCancelAppointment = (appointmentDate: string, appointmentTime: string) => {
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();
    const diffInHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffInHours >= 24; // Can cancel if appointment is at least 24 hours away
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'programada': { label: 'Programada', variant: 'secondary' as const },
      'confirmada': { label: 'Confirmada', variant: 'default' as const },
      'completada': { label: 'Completada', variant: 'outline' as const },
      'cancelada': { label: 'Cancelada', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.programada;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-muted-foreground">Cargando citas...</div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {showHistory ? "Sin historial de citas" : "No tienes citas programadas"}
          </h3>
          <p className="text-muted-foreground text-center">
            {showHistory 
              ? "Cuando completes tus citas aparecerán aquí"
              : "Agenda tu primera cita para comenzar"
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <Card key={appointment.id} className="hover:shadow-hover transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center">
                  <User className="h-4 w-4 mr-2 text-primary" />
                  {getDoctorName(appointment.doctor_id)}
                </CardTitle>
                <CardDescription className="flex items-center">
                  {getSpecialtyName(appointment.specialty_id)}
                </CardDescription>
              </div>
              {getStatusBadge(appointment.status || 'programada')}
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex items-center gap-4 mb-4 text-sm">
              <div className="flex items-center text-primary">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{new Date(appointment.appointment_date).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center text-primary">
                <Clock className="h-4 w-4 mr-1" />
                <span>{appointment.appointment_time}</span>
              </div>
            </div>

            {appointment.notes && (
              <div className="mb-4 p-3 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Motivo:</strong> {appointment.notes}
                </p>
              </div>
            )}

            {!showHistory && appointment.status !== 'cancelada' && (
              <div className="flex gap-2">
                {canCancelAppointment(appointment.appointment_date, appointment.appointment_time!) ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <MedicalButton 
                        variant="destructive" 
                        size="sm"
                        disabled={cancellingId === appointment.id}
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Cancelar
                      </MedicalButton>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Cancelar cita?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Tu cita será cancelada y deberás agendar una nueva si necesitas atención médica.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>No, mantener cita</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Sí, cancelar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    No se puede cancelar (menos de 24 horas para la cita)
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};