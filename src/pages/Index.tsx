import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { MedicalButton } from "@/components/ui/medical-button";
import { Calendar, Clock, Shield, Star, ChevronRight } from "lucide-react";
import saludUisLogo from "@/assets/salud-uis-logo.png";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary">
        <div className="text-center">
          <img src={saludUisLogo} alt="Salud UIS" className="h-16 w-16 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    {
      title: "Agendar Citas",
      description: "Reserva citas médicas de forma rápida y sencilla",
      icon: Calendar,
    },
    {
      title: "Horarios Flexibles",
      description: "Disponibilidad en horarios de oficina convenientes",
      icon: Clock,
    },
    {
      title: "Seguro y Confiable",
      description: "Tu información médica protegida con los más altos estándares",
      icon: Shield,
    },
    {
      title: "Profesionales Calificados",
      description: "Médicos especialistas con amplia experiencia",
      icon: Star,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/5">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm shadow-card border-b border-primary/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={saludUisLogo} alt="Salud UIS" className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-primary">Salud UIS</h1>
              <p className="text-sm text-muted-foreground">Sistema de Citas Médicas</p>
            </div>
          </div>
          
          <MedicalButton variant="medical" asChild>
            <a href="/auth">
              Acceder
              <ChevronRight className="ml-2 h-4 w-4" />
            </a>
          </MedicalButton>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <img 
            src={saludUisLogo} 
            alt="Salud UIS Logo" 
            className="h-24 w-24 mx-auto mb-8"
          />
          <h1 className="text-5xl font-bold text-primary mb-6 leading-tight">
            Tu Salud, Nuestra Prioridad
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Agenda citas médicas de forma fácil y segura con los mejores profesionales 
            de la salud. Gestiona tu historial médico y recibe recordatorios automáticos.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <MedicalButton variant="medical" size="lg" asChild>
              <a href="/auth">
                Agendar Mi Primera Cita
                <Calendar className="ml-2 h-5 w-5" />
              </a>
            </MedicalButton>
            <MedicalButton variant="outline" size="lg">
              Conocer Más
            </MedicalButton>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-primary mb-4">
            ¿Por qué elegir Salud UIS?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ofrecemos una experiencia médica integral con tecnología de vanguardia 
            y el mejor equipo de profesionales de la salud.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={index} 
                className="text-center hover:shadow-hover transition-all duration-300 border-primary/10"
              >
                <CardHeader>
                  <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary mb-4">
            ¡Comienza a Cuidar tu Salud Hoy!
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Únete a miles de pacientes que ya confían en nuestro sistema de citas médicas. 
            Regístrate ahora y agenda tu primera consulta.
          </p>
          
          <MedicalButton variant="medical" size="lg" asChild>
            <a href="/auth">
              Crear Cuenta Gratis
              <ChevronRight className="ml-2 h-5 w-5" />
            </a>
          </MedicalButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-primary/10 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src={saludUisLogo} alt="Salud UIS" className="h-8 w-8" />
            <span className="text-lg font-semibold text-primary">Salud UIS</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Salud UIS. Sistema de Agendamiento de Citas Médicas.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
