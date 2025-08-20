-- Fix remaining critical security and constraint issues

-- First, let's check and fix the notifications type constraint
-- Remove the old constraint if it exists and create a proper one
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add proper constraint for notification types
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'appointment_created',
  'appointment_confirmed', 
  'appointment_cancelled',
  'appointment_completed',
  'appointment_rescheduled',
  'appointment_reminder',
  'system_notification',
  'promotional'
));

-- Fix the typo in the notification trigger function
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
          ' a las ' || NEW.appointment_time || ' ha sido cancelada'
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

-- Ensure all our custom tables have RLS enabled properly
-- This is a more direct approach to enable RLS
DO $$
DECLARE
    tables_to_fix text[] := ARRAY['appointments', 'profiles', 'notifications', 'reviews', 'doctors', 'specialties'];
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY tables_to_fix
    LOOP
        -- Enable RLS if not already enabled
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END LOOP;
END
$$;

-- Ensure proper indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_doctor_id ON public.reviews(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty_id ON public.doctors(specialty_id);

-- Clean up any invalid notification types that might exist
DELETE FROM public.notifications 
WHERE type NOT IN (
  'appointment_created',
  'appointment_confirmed', 
  'appointment_cancelled',
  'appointment_completed',
  'appointment_rescheduled',
  'appointment_reminder',
  'system_notification',
  'promotional'
);