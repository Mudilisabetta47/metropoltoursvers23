import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, EyeOff, Eye, CheckCircle } from 'lucide-react';
import { LogoLight } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import heroImage from '@/assets/hero-group-travel.jpg';
import { useRecaptcha } from '@/hooks/useRecaptcha';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { protect } = useRecaptcha();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    // Also check hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen haben');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }

    setIsSubmitting(true);

    try {
      const human = await protect('password_change');
      if (!human) {
        toast.error('Sicherheitsprüfung fehlgeschlagen.');
        setIsSubmitting(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Passwort erfolgreich geändert!');
      navigate('/');
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Ein Fehler ist aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Wiederherstellungslink wird überprüft...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Visual Panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
      >
        <img src={heroImage} alt="Reisen durch den Balkan" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-primary/50" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <a href="/" className="inline-block">
            <LogoLight size="lg" />
          </a>
          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight">Neues Passwort setzen</h1>
            <p className="text-lg text-primary-foreground/90 max-w-md">
              Geben Sie Ihr neues Passwort ein, um den Zugang zu Ihrem Konto wiederherzustellen.
            </p>
          </div>
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} Metropol Tours. Alle Rechte vorbehalten.
          </p>
        </div>
      </motion.div>

      {/* Right Side - Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        className="flex-1 flex flex-col bg-background"
      >
        <div className="lg:hidden relative h-40 overflow-hidden">
          <img src={heroImage} alt="Reisen" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary/60" />
          <div className="relative z-10 flex items-center justify-center h-full">
            <a href="/" className="inline-block">
              <LogoLight size="md" />
            </a>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-xl border border-border/50 p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground">Neues Passwort</h2>
                <p className="text-muted-foreground mt-2">
                  Wählen Sie ein neues sicheres Passwort
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Neues Passwort</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">Passwort bestätigen</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 h-12 rounded-xl bg-background border-input"
                    />
                  </div>
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-sm text-destructive">Passwörter stimmen nicht überein</p>
                  )}
                  {password && confirmPassword && password === confirmPassword && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Passwörter stimmen überein
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl text-base font-medium" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
                  ) : (
                    'Passwort ändern'
                  )}
                </Button>
              </form>
            </div>

            <div className="mt-6 text-center">
              <a href="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Zurück zum Login
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
