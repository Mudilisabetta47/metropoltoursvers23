import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bus, Mail, Lock, User, Phone, Eye, EyeOff, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const emailSchema = z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein');
const passwordSchema = z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben');

type AuthMode = 'login' | 'register';
type UserType = 'customer' | 'agent';

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, isLoading } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [userType, setUserType] = useState<UserType>(
    searchParams.get('type') === 'agent' ? 'agent' : 'customer'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    try {
      emailSchema.parse(formData.email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(formData.password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    
    if (mode === 'register') {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'Vorname ist erforderlich';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Nachname ist erforderlich';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (mode === 'login') {
        const { error } = await signIn(formData.email, formData.password);
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('E-Mail oder Passwort ist falsch');
          } else {
            toast.error(error.message);
          }
          return;
        }
        
        toast.success('Erfolgreich angemeldet!');
        navigate('/');
      } else {
        const { error } = await signUp(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName
        );
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Diese E-Mail-Adresse ist bereits registriert');
          } else {
            toast.error(error.message);
          }
          return;
        }
        
        toast.success('Konto erfolgreich erstellt! Sie können sich jetzt anmelden.');
        setMode('login');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Ein Fehler ist aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <a href="/" className="inline-flex items-center gap-2 group">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
                <Bus className="w-7 h-7 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">
                Metropol <span className="text-primary">Tours</span>
              </span>
            </a>
          </div>

          {/* Card */}
          <div className="bg-card rounded-2xl shadow-elevated p-6 lg:p-8">
            {/* User Type Toggle (subtle for agent access) */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex bg-muted rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setUserType('customer')}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2',
                    userType === 'customer'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <User className="w-4 h-4" />
                  Kunde
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('agent')}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2',
                    userType === 'agent'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Building2 className="w-4 h-4" />
                  Agentur
                </button>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-foreground text-center mb-2">
              {mode === 'login' ? 'Anmelden' : 'Registrieren'}
            </h1>
            <p className="text-muted-foreground text-center mb-6">
              {mode === 'login' 
                ? userType === 'agent' 
                  ? 'Melden Sie sich als Agentur an'
                  : 'Melden Sie sich mit Ihrem Konto an'
                : 'Erstellen Sie ein neues Konto'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Vorname *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Max"
                      className="mt-1"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nachname *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Mustermann"
                      className="mt-1"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email">E-Mail *</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="max@beispiel.de"
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Passwort *</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">{errors.password}</p>
                )}
              </div>

              {mode === 'register' && (
                <div>
                  <Label htmlFor="phone">Telefon (optional)</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+49 123 456789"
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                ) : mode === 'login' ? (
                  'Anmelden'
                ) : (
                  'Registrieren'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {mode === 'login' ? (
                  <>
                    Noch kein Konto?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-primary hover:underline font-medium"
                    >
                      Jetzt registrieren
                    </button>
                  </>
                ) : (
                  <>
                    Bereits registriert?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-primary hover:underline font-medium"
                    >
                      Anmelden
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Back to home */}
          <div className="text-center mt-6">
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Zurück zur Startseite
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
