-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('masculino', 'femenino', 'otro')),
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create specialties table
CREATE TABLE public.specialties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  duration_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  specialty_id UUID NOT NULL REFERENCES public.specialties(id),
  license_number TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  bio TEXT,
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  specialty_id UUID NOT NULL REFERENCES public.specialties(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'programada' CHECK (status IN ('programada', 'confirmada', 'completada', 'cancelada')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure no double booking
  UNIQUE(doctor_id, appointment_date, appointment_time)
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one review per appointment
  UNIQUE(appointment_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('recordatorio', 'confirmacion', 'cancelacion')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for specialties (public read)
CREATE POLICY "Anyone can view specialties" 
ON public.specialties FOR SELECT 
USING (true);

-- Create RLS policies for doctors (public read)
CREATE POLICY "Anyone can view active doctors" 
ON public.doctors FOR SELECT 
USING (is_active = true);

-- Create RLS policies for appointments
CREATE POLICY "Users can view their own appointments" 
ON public.appointments FOR SELECT 
USING (auth.uid() = patient_id);

CREATE POLICY "Users can create their own appointments" 
ON public.appointments FOR INSERT 
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can update their own appointments" 
ON public.appointments FOR UPDATE 
USING (auth.uid() = patient_id);

-- Create RLS policies for reviews
CREATE POLICY "Users can view all reviews" 
ON public.reviews FOR SELECT 
USING (true);

CREATE POLICY "Users can create reviews for their appointments" 
ON public.reviews FOR INSERT 
WITH CHECK (auth.uid() = patient_id);

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample specialties
INSERT INTO public.specialties (name, description, duration_minutes) VALUES
('Medicina General', 'Consulta médica general y evaluación inicial', 30),
('Cardiología', 'Especialista en enfermedades del corazón', 45),
('Dermatología', 'Especialista en enfermedades de la piel', 30),
('Ginecología', 'Especialista en salud femenina', 45),
('Pediatría', 'Especialista en salud infantil', 30),
('Ortopedia', 'Especialista en huesos y articulaciones', 45),
('Psicología', 'Consulta de salud mental', 60),
('Neurología', 'Especialista en sistema nervioso', 45);

-- Insert sample doctors
INSERT INTO public.doctors (full_name, specialty_id, license_number, email, phone, bio) VALUES
('Dr. Carlos Mendoza', (SELECT id FROM public.specialties WHERE name = 'Medicina General'), 'MED001', 'carlos.mendoza@saluduis.com', '3001234567', 'Médico general con 15 años de experiencia'),
('Dra. Ana García', (SELECT id FROM public.specialties WHERE name = 'Cardiología'), 'CAR001', 'ana.garcia@saluduis.com', '3002345678', 'Cardióloga especialista en prevención cardiovascular'),
('Dr. Luis Rodríguez', (SELECT id FROM public.specialties WHERE name = 'Dermatología'), 'DER001', 'luis.rodriguez@saluduis.com', '3003456789', 'Dermatólogo especialista en dermatología estética'),
('Dra. María Fernández', (SELECT id FROM public.specialties WHERE name = 'Ginecología'), 'GIN001', 'maria.fernandez@saluduis.com', '3004567890', 'Ginecóloga con enfoque en salud reproductiva'),
('Dr. Andrés Vásquez', (SELECT id FROM public.specialties WHERE name = 'Pediatría'), 'PED001', 'andres.vasquez@saluduis.com', '3005678901', 'Pediatra especialista en desarrollo infantil'),
('Dra. Carmen Jiménez', (SELECT id FROM public.specialties WHERE name = 'Psicología'), 'PSI001', 'carmen.jimenez@saluduis.com', '3006789012', 'Psicóloga clínica especialista en terapia cognitiva');

-- Create trigger for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();