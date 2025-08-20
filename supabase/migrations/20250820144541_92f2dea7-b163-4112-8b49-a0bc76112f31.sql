-- Fix critical security issues

-- Enable RLS on all tables that don't have it
-- First check if RLS is already enabled to avoid errors
DO $$
BEGIN
    -- Enable RLS on key tables if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'appointments' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'profiles' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'notifications' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'reviews' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'doctors' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'specialties' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Update all functions to have proper search_path
CREATE OR REPLACE FUNCTION public.create_appointment_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create reminders for appointments happening tomorrow
  INSERT INTO public.notifications (user_id, appointment_id, type, title, message)
  SELECT 
    a.patient_id,
    a.id,
    'appointment_reminder',
    'Recordatorio de Cita',
    'Recuerda que tienes una cita mañana a las ' || a.appointment_time || 
    '. Por favor llega 15 minutos antes.'
  FROM public.appointments a
  WHERE a.appointment_date = CURRENT_DATE + INTERVAL '1 day'
    AND a.status = 'confirmada'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.appointment_id = a.id 
        AND n.type = 'appointment_reminder'
        AND n.created_at::date = CURRENT_DATE
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_appointment_stats(patient_user_id uuid)
RETURNS TABLE(total_appointments bigint, upcoming_appointments bigint, completed_appointments bigint, cancelled_appointments bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_appointments,
    COUNT(*) FILTER (WHERE status IN ('programada', 'confirmada') AND appointment_date >= CURRENT_DATE) as upcoming_appointments,
    COUNT(*) FILTER (WHERE status = 'completada') as completed_appointments,
    COUNT(*) FILTER (WHERE status = 'cancelada') as cancelled_appointments
  FROM public.appointments
  WHERE patient_id = patient_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_appointment_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- For new appointments
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, appointment_id, type, title, message)
    VALUES (
      NEW.patient_id,
      NEW.id,
      'appointment_created',
      'Cita Agendada',
      'Tu cita ha sido agendada exitosamente para el ' || 
      to_char(NEW.appointment_date::date, 'DD/MM/YYYY') || 
      ' a las ' || NEW.appointment_time
    );
    RETURN NEW;
  END IF;

  -- For appointment updates
  IF TG_OP = 'UPDATE' THEN
    -- Status change notifications
    IF OLD.status != NEW.status THEN
      IF NEW.status = 'confirmada' THEN
        INSERT INTO public.notifications (user_id, appointment_id, type, title, message)
        VALUES (
          NEW.patient_id,
          NEW.id,
          'appointment_confirmed',
          'Cita Confirmada',
          'Tu cita para el ' || 
          to_char(NEW.appointment_date::date, 'DD/MM/YYYY') || 
          ' a las ' || NEW.appointment_time || ' ha sido confirmada'
        );
      ELSIF NEW.status = 'cancelada' THEN
        INSERT INTO public.notifications (user_id, appointment_id, type, title, message)
        VALUES (
          NEW.patient_id,
          NEW.id,
          'appointment_cancelled',
          'Cita Cancelada',
          'Tu cita para el ' || 
          to_char(NEW.appointment_date::date, 'DD/MM/YYYY') || 
          ' a las ' || NEW.apartment_time || ' ha sido cancelada'
        );
      ELSIF NEW.status = 'completada' THEN
        INSERT INTO public.notifications (user_id, appointment_id, type, title, message)
        VALUES (
          NEW.patient_id,
          NEW.id,
          'appointment_completed',
          'Cita Completada',
          'Tu cita ha sido completada. ¿Te gustaría dejar una reseña?'
        );
      END IF;
    END IF;

    -- Date/time change notifications
    IF OLD.appointment_date != NEW.appointment_date OR OLD.appointment_time != NEW.appointment_time THEN
      INSERT INTO public.notifications (user_id, appointment_id, type, title, message)
      VALUES (
        NEW.patient_id,
        NEW.id,
        'appointment_rescheduled',
        'Cita Reprogramada',
        'Tu cita ha sido reprogramada para el ' || 
        to_char(NEW.appointment_date::date, 'DD/MM/YYYY') || 
        ' a las ' || NEW.appointment_time
      );
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'));
  RETURN NEW;
END;
$function$;

-- Create triggers if they don't exist
DO $$
BEGIN
    -- Check and create appointment notification trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'appointment_notification_trigger'
    ) THEN
        CREATE TRIGGER appointment_notification_trigger
        AFTER INSERT OR UPDATE ON public.appointments
        FOR EACH ROW EXECUTE FUNCTION public.create_appointment_notification();
    END IF;

    -- Check and create updated_at triggers
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_appointments_updated_at'
    ) THEN
        CREATE TRIGGER update_appointments_updated_at
        BEFORE UPDATE ON public.appointments
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_profiles_updated_at'
    ) THEN
        CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    -- Check and create new user trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;