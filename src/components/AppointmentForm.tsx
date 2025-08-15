import { useState } from "react";
import { useSpecialties } from "@/hooks/useSpecialties";
import { useDoctors } from "@/hooks/useDoctors";
import { useAppointments } from "@/hooks/useAppointments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MedicalButton } from "@/components/ui/medical-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock } from "lucide-react";

interface AppointmentFormProps {
  onSuccess?: () => void;
}

export const AppointmentForm = ({ onSuccess }: AppointmentFormProps) => {
  const { specialties, loading: specialtiesLoading } = useSpecialties();
  const { doctors, getDoctorsBySpecialty } = useDoctors();
  const { createAppointment } = useAppointments();
  const { toast } = useToast();

  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Generate available time slots (9:00 AM to 5:00 PM, 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 17 && minute > 0) break; // Stop at 5:00 PM
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const availableDoctors = selectedSpecialty ? getDoctorsBySpecialty(selectedSpecialty) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSpecialty || !selectedDoctor || !appointmentDate || !appointmentTime) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    // Check if date is not in the past
    const selectedDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();
    if (selectedDateTime <= now) {
      toast({
        title: "Error",
        description: "No puedes agendar citas en el pasado",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await createAppointment({
      specialty_id: selectedSpecialty,
      doctor_id: selectedDoctor,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      notes: notes || null,
      status: 'programada'
    });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo agendar la cita. Intenta nuevamente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "¡Cita agendada!",
        description: "Tu cita ha sido agendada exitosamente",
      });
      
      // Reset form
      setSelectedSpecialty("");
      setSelectedDoctor("");
      setAppointmentDate("");
      setAppointmentTime("");
      setNotes("");
      
      onSuccess?.();
    }

    setLoading(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center text-primary">
          <Calendar className="h-5 w-5 mr-2" />
          Agendar Nueva Cita
        </CardTitle>
        <CardDescription>
          Completa el formulario para solicitar una cita médica
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidad *</Label>
              <Select 
                value={selectedSpecialty} 
                onValueChange={(value) => {
                  setSelectedSpecialty(value);
                  setSelectedDoctor(""); // Reset doctor when specialty changes
                }}
                disabled={specialtiesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una especialidad" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctor">Profesional *</Label>
              <Select 
                value={selectedDoctor} 
                onValueChange={setSelectedDoctor}
                disabled={!selectedSpecialty || availableDoctors.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un profesional" />
                </SelectTrigger>
                <SelectContent>
                  {availableDoctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input
                id="date"
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} // Minimum is today
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Hora *</Label>
              <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                <SelectTrigger>
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Selecciona una hora" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Motivo de la consulta (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Describe brevemente el motivo de tu consulta..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <MedicalButton 
              type="submit" 
              variant="medical" 
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Agendando..." : "Agendar Cita"}
            </MedicalButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};