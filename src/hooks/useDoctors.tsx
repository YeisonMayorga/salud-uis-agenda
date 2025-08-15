import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Doctor = Database['public']['Tables']['doctors']['Row'];

export const useDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (error) {
        console.error('Error fetching doctors:', error);
        return;
      }

      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDoctorsBySpecialty = (specialtyId: string) => {
    return doctors.filter(doctor => doctor.specialty_id === specialtyId);
  };

  return {
    doctors,
    loading,
    getDoctorsBySpecialty,
    refetch: fetchDoctors
  };
};