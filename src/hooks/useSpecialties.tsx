import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Specialty = Database['public']['Tables']['specialties']['Row'];

export const useSpecialties = () => {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const fetchSpecialties = async () => {
    try {
      const { data, error } = await supabase
        .from('specialties')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching specialties:', error);
        return;
      }

      setSpecialties(data || []);
    } catch (error) {
      console.error('Error fetching specialties:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    specialties,
    loading,
    refetch: fetchSpecialties
  };
};