import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Shield, CheckCircle } from 'lucide-react';
import { Logo, LogoLight } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { motion } from 'framer-motion';
import heroImage from '@/assets/hero-group-travel.jpg';

const emailSchema = z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein');
const passwordSchema = z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben');

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, signIn, signUp, isLoading } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
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
        
        toast.success('Konto erfolgreich erstellt! Bitte bestätigen Sie Ihre E-Mail-Adresse.');
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Visual Panel (hidden on mobile, shown on lg+) */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
      >
        {/* Background Image */}
        <img 
          src={heroImage} 
          alt="Reisen durch den Balkan" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-primary/50" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          {/* Logo */}
          <a href="/" className="inline-flex items-center gap-3 group w-fit">
            <div className="w-12 h-12 bg-background/20 backdrop-blur-sm rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
              <Bus className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold">
              Metropol Tours
            </span>
          </a>
          
          {/* Slogan */}
          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
              Entdecke Europa
            </h1>
            <p className="text-lg text-primary-foreground/90 max-w-md">
              Erleben Sie unvergessliche Reisen quer durch Europa. 
              Busreisen, Pauschalangebote und individuelle Touren – komfortabel, sicher und zu fairen Preisen.
            </p>
            
            {/* Features */}
            <div className="flex flex-col gap-3 pt-4">
              {['Europaweite Reiseziele', 'Attraktive Pauschalangebote', 'Sichere Online-Buchung'].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-primary-foreground/90">
                  <CheckCircle className="w-5 h-5 text-primary-foreground" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Bottom Attribution */}
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} Metropol Tours. Alle Rechte vorbehalten.
          </p>
        </div>
      </motion.div>

      {/* Right Side - Form Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        className="flex-1 flex flex-col bg-background"
      >
        {/* Mobile Header with Image */}
        <div className="lg:hidden relative h-40 overflow-hidden">
          <img 
            src={heroImage} 
            alt="Reisen" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary/60" />
          <div className="relative z-10 flex items-center justify-center h-full">
            <a href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-background/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Bus className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary-foreground">
                Metropol Tours
              </span>
            </a>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Form Card with Glassmorphism */}
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-xl border border-border/50 p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground">
                  {mode === 'login' ? 'Willkommen zurück' : 'Konto erstellen'}
                </h2>
                <p className="text-muted-foreground mt-2">
                  {mode === 'login' 
                    ? 'Melden Sie sich an, um fortzufahren'
                    : 'Registrieren Sie sich für ein neues Konto'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'register' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-foreground">Vorname</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="Max"
                          className="pl-10 h-12 rounded-xl bg-background border-input"
                        />
                      </div>
                      {errors.firstName && (
                        <p className="text-sm text-destructive">{errors.firstName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-foreground">Nachname</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Mustermann"
                        className="h-12 rounded-xl bg-background border-input"
                      />
                      {errors.lastName && (
                        <p className="text-sm text-destructive">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">E-Mail-Adresse</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="max@beispiel.de"
                      className="pl-10 h-12 rounded-xl bg-background border-input"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground">Passwort</Label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        className="text-sm text-primary hover:underline"
                        onClick={() => toast.info('Passwort-Reset kommt bald!')}
                      >
                        Passwort vergessen?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-12 rounded-xl bg-background border-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
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

            {/* Trust Badges */}
            <div className="mt-6 flex items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4" />
                <span>Sichere Verbindung</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Lock className="w-4 h-4" />
                <span>Datenschutz</span>
              </div>
            </div>

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <a 
                href="/" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Zurück zur Startseite
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
