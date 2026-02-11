import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AvatarUploadProps {
    userId: string;
    currentAvatarUrl: string | null;
    onAvatarUpdate: (url: string) => void;
}

export default function AvatarUpload({ userId, currentAvatarUrl, onAvatarUpdate }: AvatarUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(currentAvatarUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setError(null);
            setUploading(true);

            const file = event.target.files?.[0];
            if (!file) return;

            // Validar tipo de archivo
            if (!file.type.startsWith('image/')) {
                throw new Error('Por favor selecciona una imagen válida');
            }

            // Validar tamaño (5MB máximo)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('La imagen no debe superar los 5MB');
            }

            // Crear preview local
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Generar nombre único para el archivo
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

            // Eliminar avatar anterior si existe
            if (currentAvatarUrl) {
                const oldPath = currentAvatarUrl.split('/').pop();
                if (oldPath) {
                    await supabase.storage
                        .from('avatars')
                        .remove([`${userId}/${oldPath}`]);
                }
            }

            // Subir nueva imagen
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // Actualizar en la base de datos
            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl })
                .eq('id', userId);

            if (updateError) throw updateError;

            onAvatarUpdate(publicUrl);
        } catch (err: any) {
            console.error('Error uploading avatar:', err);
            setError(err.message || 'Error al subir la imagen');
            setPreview(currentAvatarUrl);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveAvatar = async () => {
        try {
            setError(null);
            setUploading(true);

            if (currentAvatarUrl) {
                const oldPath = currentAvatarUrl.split('/').pop();
                if (oldPath) {
                    await supabase.storage
                        .from('avatars')
                        .remove([`${userId}/${oldPath}`]);
                }
            }

            // Actualizar en la base de datos
            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url: null })
                .eq('id', userId);

            if (updateError) throw updateError;

            setPreview(null);
            onAvatarUpdate('');
        } catch (err: any) {
            console.error('Error removing avatar:', err);
            setError(err.message || 'Error al eliminar la imagen');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-slate-800 shadow-lg">
                    {preview ? (
                        <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <Camera size={48} />
                    )}
                </div>

                {/* Overlay con botones */}
                <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="p-2 bg-purple-600 hover:bg-purple-500 rounded-full text-white transition-colors disabled:opacity-50"
                        title="Cambiar foto"
                    >
                        {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                    </button>

                    {preview && (
                        <button
                            onClick={handleRemoveAvatar}
                            disabled={uploading}
                            className="p-2 bg-red-600 hover:bg-red-500 rounded-full text-white transition-colors disabled:opacity-50"
                            title="Eliminar foto"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {error && (
                <p className="text-sm text-red-400">{error}</p>
            )}

            <p className="text-xs text-slate-500 text-center">
                Haz clic en la imagen para cambiarla<br />
                Máximo 5MB - JPG, PNG, WebP o GIF
            </p>
        </div>
    );
}
