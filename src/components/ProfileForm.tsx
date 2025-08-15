import { useState, useEffect } from "react";
import { useProfiles } from "@/hooks/useProfiles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MedicalButton } from "@/components/ui/medical-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Save } from "lucide-react";

export const ProfileForm = () => {
  const { profile, updateProfile, loading: profileLoading } = useProfiles();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    birth_date: "",
    gender: "",
    address: "",
    emergency_contact: "",
    emergency_phone: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        birth_date: profile.birth_date || "",
        gender: profile.gender || "",
        address: profile.address || "",
        emergency_contact: profile.emergency_contact || "",
        emergency_phone: profile.emergency_phone || "",
      });
    }
  }, [profile]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim()) {
      toast({
        title: "Error",
        description: "El nombre completo es requerido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const updates = {
      ...formData,
      birth_date: formData.birth_date || null,
      phone: formData.phone || null,
      gender: formData.gender || null,
      address: formData.address || null,
      emergency_contact: formData.emergency_contact || null,
      emergency_phone: formData.emergency_phone || null,
    };

    const { error } = await updateProfile(updates);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil. Intenta nuevamente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido guardada exitosamente",
      });
    }

    setLoading(false);
  };

  if (profileLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-muted-foreground">Cargando perfil...</div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center text-primary">
          <User className="h-5 w-5 mr-2" />
          Mi Perfil
        </CardTitle>
        <CardDescription>
          Actualiza tu información personal y de contacto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder="Tu nombre completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Número de teléfono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleChange("birth_date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Género</Label>
              <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                  <SelectItem value="prefiero_no_decir">Prefiero no decir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Tu dirección completa"
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Contacto de Emergencia</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Nombre</Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) => handleChange("emergency_contact", e.target.value)}
                  placeholder="Nombre del contacto de emergencia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_phone">Teléfono</Label>
                <Input
                  id="emergency_phone"
                  type="tel"
                  value={formData.emergency_phone}
                  onChange={(e) => handleChange("emergency_phone", e.target.value)}
                  placeholder="Teléfono de emergencia"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <MedicalButton 
              type="submit" 
              variant="medical" 
              className="flex-1"
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Guardando..." : "Guardar Cambios"}
            </MedicalButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};