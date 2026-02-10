import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [showReset, setShowReset] = useState(false);

    const { signIn, signUp, resetPassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (showReset) {
                const { error } = await resetPassword(email);
                if (error) throw error;
                setResetSent(true);
            } else if (isLogin) {
                const { error } = await signIn(email, password);
                if (error) throw error;
                navigate('/');
            } else {
                const { error } = await signUp(email, password, fullName);
                if (error) throw error;
                setError('¡Cuenta creada! Revisa tu email para confirmar.');
            }
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-blue-950/20 p-4">
            <div className="w-full max-w-md">
                {/* Logo y Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4 shadow-lg shadow-blue-500/25">
                        <Brain className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Neuracall CRM</h1>
                    <p className="text-muted-foreground">
                        {showReset
                            ? 'Recupera tu contraseña'
                            : isLogin
                                ? 'Inicia sesión en tu cuenta'
                                : 'Crea tu cuenta'}
                    </p>
                </div>

                {/* Card de Login/Signup */}
                <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-8 shadow-xl">
                    {resetSent ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-green-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">Email enviado</h3>
                            <p className="text-muted-foreground mb-6">
                                Revisa tu correo para restablecer tu contraseña
                            </p>
                            <button
                                onClick={() => {
                                    setShowReset(false);
                                    setResetSent(false);
                                }}
                                className="text-primary hover:underline"
                            >
                                Volver al inicio de sesión
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Full Name (solo en signup) */}
                            {!isLogin && !showReset && (
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Nombre completo
                                    </label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                        placeholder="Juan Pérez"
                                        required={!isLogin}
                                    />
                                </div>
                            )}

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 rounded-lg bg-background/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                        placeholder="tu@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password (no en reset) */}
                            {!showReset && (
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Contraseña
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 rounded-lg bg-background/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading
                                    ? 'Procesando...'
                                    : showReset
                                        ? 'Enviar email de recuperación'
                                        : isLogin
                                            ? 'Iniciar sesión'
                                            : 'Crear cuenta'}
                            </button>

                            {/* Links */}
                            <div className="text-center space-y-2">
                                {!showReset && isLogin && (
                                    <button
                                        type="button"
                                        onClick={() => setShowReset(true)}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                )}

                                <div className="pt-2 border-t border-border/30">
                                    {showReset ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowReset(false)}
                                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            Volver al inicio de sesión
                                        </button>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsLogin(!isLogin);
                                                    setError('');
                                                }}
                                                className="text-primary hover:underline font-medium"
                                            >
                                                {isLogin ? 'Regístrate' : 'Inicia sesión'}
                                            </button>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-muted-foreground mt-6">
                    © 2026 Neuracall. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}
