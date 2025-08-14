import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MedicalButton } from "@/components/ui/medical-button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import saludUisLogo from "@/assets/salud-uis-logo.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Error de inicio de sesión",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "¡Bienvenido!",
            description: "Has iniciado sesión correctamente",
            variant: "default",
          });
        }
      } else {
        if (!fullName.trim()) {
          toast({
            title: "Error",
            description: "Por favor ingresa tu nombre completo",
            variant: "destructive",
          });
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({
            title: "Error de registro",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "¡Registro exitoso!",
            description: "Revisa tu email para confirmar tu cuenta",
            variant: "default",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src={saludUisLogo} 
            alt="Salud UIS Logo" 
            className="h-20 w-20 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-primary">Salud UIS</h1>
          <p className="text-muted-foreground">Sistema de Agendamiento de Citas Médicas</p>
        </div>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-center text-primary">
              {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin 
                ? "Ingresa tus credenciales para acceder" 
                : "Regístrate para agendar tus citas médicas"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre Completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Tu nombre completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-primary/20 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-primary/20 focus:border-primary"
                />
              </div>
              
              <MedicalButton 
                type="submit" 
                variant="medical" 
                className="w-full" 
                disabled={loading}
              >
                {loading 
                  ? "Procesando..." 
                  : isLogin 
                    ? "Iniciar Sesión" 
                    : "Crear Cuenta"
                }
              </MedicalButton>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline font-medium"
                >
                  {isLogin ? "Regístrate aquí" : "Inicia sesión"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;