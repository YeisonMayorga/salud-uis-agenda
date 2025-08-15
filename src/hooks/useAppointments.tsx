import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Database } from "@/integrations/supabase/types";

type Appointment = Database['public']['Tables']['appointments']['Row'];
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];

export const useAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        return;
      }

      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (appointmentData: Omit<AppointmentInsert, 'patient_id'>) => {
    if (!user) return { error: 'No user found' };

    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...appointmentData,
          patient_id: user.id
        })
        .select()
        .single();

      if (error) {
        return { error };
      }

      setAppointments(prev => [...prev, data]);
      return { data, error: null };
    } catch (error) {
      return { error };
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    if (!user) return { error: 'No user found' };

    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .eq('patient_id', user.id)
        .select()
        .single();

      if (error) {
        return { error };
      }

      setAppointments(prev => 
        prev.map(apt => apt.id === id ? data : apt)
      );
      return { data, error: null };
    } catch (error) {
      return { error };
    }
  };

  const cancelAppointment = async (id: string) => {
    return updateAppointment(id, { status: 'cancelada' });
  };

  const getUpcomingAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => 
      apt.appointment_date >= today && apt.status !== 'cancelada'
    );
  };

  const getAppointmentHistory = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => 
      apt.appointment_date < today || apt.status === 'completada'
    );
  };

  return {
    appointments,
    loading,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    getUpcomingAppointments,
    getAppointmentHistory,
    refetch: fetchAppointments
  };
};