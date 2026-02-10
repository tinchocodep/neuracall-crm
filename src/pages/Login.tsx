import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

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
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-md relative z-10 px-4">
                {/* Logo y Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white mb-6 shadow-2xl shadow-blue-500/50 relative group p-3">
                        <img
                            src="/neuracall-logo.png"
                            alt="Neuracall Logo"
                            className="w-full h-full object-contain relative z-10"
                        />
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-30 transition-opacity blur-xl"></div>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent mb-3">
                        Neuracall CRM
                    </h1>
                    <p className="text-slate-400 text-lg flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        {showReset
                            ? 'Recupera tu contraseña'
                            : isLogin
                                ? 'Bienvenido de vuelta'
                                : 'Comienza tu viaje'}
                    </p>
                </div>

                {/* Card de Login/Signup */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Gradient border effect */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 pointer-events-none"></div>

                    <div className="relative z-10">
                        {resetSent ? (
                            <div className="text-center py-8">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                                    <Mail className="w-10 h-10 text-green-400" />
                                </div>
                                <h3 className="text-2xl font-semibold text-white mb-3">Email enviado</h3>
                                <p className="text-slate-400 mb-8 text-lg">
                                    Revisa tu correo para restablecer tu contraseña
                                </p>
                                <button
                                    onClick={() => {
                                        setShowReset(false);
                                        setResetSent(false);
                                    }}
                                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                                >
                                    Volver al inicio de sesión
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Full Name (solo en signup) */}
                                {!isLogin && !showReset && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-200 mb-3">
                                            Nombre completo
                                        </label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full px-5 py-4 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all text-lg"
                                            placeholder="Juan Pérez"
                                            required={!isLogin}
                                        />
                                    </div>
                                )}

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-200 mb-3">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-5 py-4 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all text-lg"
                                            placeholder="tu@email.com"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password (no en reset) */}
                                {!showReset && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-200 mb-3">
                                            Contraseña
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pl-12 pr-5 py-4 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all text-lg"
                                                placeholder="••••••••"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Demo credentials info */}
                                {isLogin && !showReset && (
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                        <p className="text-sm text-blue-300 font-medium mb-2">🎯 Credenciales de prueba:</p>
                                        <p className="text-xs text-slate-400 font-mono">Email: demo@neuracall.com</p>
                                        <p className="text-xs text-slate-400 font-mono">Contraseña: demo123</p>
                                    </div>
                                )}

                                {/* Error Message */}
                                {error && (
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-300">{error}</p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 hover:from-blue-600 hover:via-cyan-600 hover:to-blue-600 text-white font-semibold transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-2 group relative overflow-hidden"
                                >
                                    <span className="relative z-10">
                                        {loading
                                            ? 'Procesando...'
                                            : showReset
                                                ? 'Enviar email de recuperación'
                                                : isLogin
                                                    ? 'Iniciar sesión'
                                                    : 'Crear cuenta'}
                                    </span>
                                    {!loading && (
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </button>

                                {/* Links */}
                                <div className="text-center space-y-3 pt-2">
                                    {!showReset && isLogin && (
                                        <button
                                            type="button"
                                            onClick={() => setShowReset(true)}
                                            className="text-sm text-slate-400 hover:text-cyan-400 transition-colors block w-full"
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </button>
                                    )}

                                    <div className="pt-3 border-t border-slate-700/50">
                                        {showReset ? (
                                            <button
                                                type="button"
                                                onClick={() => setShowReset(false)}
                                                className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                                            >
                                                Volver al inicio de sesión
                                            </button>
                                        ) : (
                                            <p className="text-sm text-slate-400">
                                                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsLogin(!isLogin);
                                                        setError('');
                                                    }}
                                                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold"
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
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-slate-500 mt-8">
                    © 2026 Neuracall. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}
