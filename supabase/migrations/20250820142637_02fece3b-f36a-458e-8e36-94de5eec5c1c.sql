-- Fix security issues from linter

-- Fix function search path for new functions
CREATE OR REPLACE FUNCTION public.create_appointment_notification()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix function search path for reminders function
CREATE OR REPLACE FUNCTION public.create_appointment_reminders()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix function search path for stats function
CREATE OR REPLACE FUNCTION public.get_appointment_stats(patient_user_id uuid)
RETURNS TABLE(
  total_appointments bigint,
  upcoming_appointments bigint,
  completed_appointments bigint,
  cancelled_appointments bigint
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix function search path for existing functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;