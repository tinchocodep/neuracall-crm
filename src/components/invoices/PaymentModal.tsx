import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, CreditCard, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Invoice } from '../../types/crm';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: Invoice;
    onSave: () => void;
}

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Efectivo', icon: '💵' },
    { value: 'transfer', label: 'Transferencia', icon: '🏦' },
    { value: 'check', label: 'Cheque', icon: '📝' },
    { value: 'card', label: 'Tarjeta', icon: '💳' },
    { value: 'other', label: 'Otro', icon: '📋' }
];

export default function PaymentModal({ isOpen, onClose, invoice, onSave }: PaymentModalProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        amount: 0,
        payment_method: 'transfer' as string,
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
        reference_number: ''
    });

    const pendingAmount = invoice.pending_amount;
    const maxAmount = pendingAmount;

    useEffect(() => {
        if (isOpen) {
            // Pre-fill with pending amount
            setFormData({
                amount: pendingAmount,
                payment_method: 'transfer',
                payment_date: new Date().toISOString().split('T')[0],
                notes: '',
                reference_number: ''
            });
        }
    }, [isOpen, pendingAmount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate amount
            if (formData.amount <= 0 || formData.amount > maxAmount) {
                alert(`El monto debe ser mayor a 0 y no puede exceder $${maxAmount.toLocaleString('es-AR')}`);
                setLoading(false);
                return;
            }

            // Create payment record
            const { error: paymentError } = await supabase
                .from('invoice_payments')
                .insert([{
                    tenant_id: profile?.tenant_id,
                    invoice_id: invoice.id,
                    amount: formData.amount,
                    payment_method: formData.payment_method,
                    payment_date: formData.payment_date,
                    reference_number: formData.reference_number || null,
                    notes: formData.notes || null,
                    created_by: profile?.id
                }]);

            if (paymentError) throw paymentError;

            // Update invoice amounts
            const newPaidAmount = invoice.paid_amount + formData.amount;
            const newPendingAmount = invoice.total_amount - newPaidAmount;

            // Determine new payment status
            let newStatus: 'pending' | 'partial' | 'paid' = 'pending';
            if (newPendingAmount === 0) {
                newStatus = 'paid';
            } else if (newPaidAmount > 0) {
                newStatus = 'partial';
            }

            const { error: invoiceError } = await supabase
                .from('invoices')
                .update({
                    paid_amount: newPaidAmount,
                    pending_amount: newPendingAmount,
                    payment_status: newStatus
                })
                .eq('id', invoice.id);

            if (invoiceError) throw invoiceError;

            onSave();
            onClose();
            resetForm();
        } catch (error) {
            console.error('Error saving payment:', error);
            alert('Error al guardar el pago');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            amount: 0,
            payment_method: 'transfer',
            payment_date: new Date().toISOString().split('T')[0],
            notes: '',
            reference_number: ''
        });
    };

    const isFullPayment = formData.amount === pendingAmount;
    const isPartialPayment = formData.amount > 0 && formData.amount < pendingAmount;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-gradient-to-r from-emerald-600/10 to-blue-600/10 border-b border-slate-700 backdrop-blur-sm">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <CreditCard className="text-emerald-400" size={28} />
                            Registrar Pago
                        </h2>
                        <p className="text-slate-400 mt-1">
                            Factura: {invoice.invoice_number || 'Sin número'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Invoice Summary */}
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-slate-300 mb-3">Resumen de Factura</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Total</p>
                                <p className="text-lg font-bold text-white">
                                    ${invoice.total_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Pagado</p>
                                <p className="text-lg font-bold text-emerald-400">
                                    ${invoice.paid_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Pendiente</p>
                                <p className="text-lg font-bold text-amber-400">
                                    ${pendingAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                            <DollarSign size={16} className="text-emerald-400" />
                            Monto del Pago *
                        </label>
                        <input
                            type="number"
                            required
                            min="0.01"
                            max={maxAmount}
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                            className="w-full bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                        <div className="flex gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, amount: pendingAmount })}
                                className="text-xs px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                            >
                                Pago Total
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, amount: pendingAmount / 2 })}
                                className="text-xs px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                            >
                                50%
                            </button>
                        </div>

                        {/* Payment Type Indicator */}
                        {formData.amount > 0 && (
                            <div className="mt-3 p-3 bg-gradient-to-r from-emerald-600/10 to-blue-600/10 border border-emerald-500/20 rounded-lg">
                                <div className="flex items-center gap-2">
                                    {isFullPayment ? (
                                        <>
                                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                            <span className="text-sm text-emerald-400 font-medium">Pago Total - La factura quedará completamente pagada</span>
                                        </>
                                    ) : isPartialPayment ? (
                                        <>
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                            <span className="text-sm text-blue-400 font-medium">
                                                Pago Parcial - Quedará pendiente ${(pendingAmount - formData.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle size={16} className="text-amber-400" />
                                            <span className="text-sm text-amber-400 font-medium">Ingresa un monto válido</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                            <CreditCard size={16} className="text-blue-400" />
                            Método de Pago *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {PAYMENT_METHODS.map((method) => (
                                <button
                                    key={method.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, payment_method: method.value })}
                                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${formData.payment_method === method.value
                                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                            : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{method.icon}</div>
                                    <div className="text-sm font-medium">{method.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Payment Date and Reference */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Payment Date */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                <Calendar size={16} className="text-blue-400" />
                                Fecha de Pago *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.payment_date}
                                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            />
                        </div>

                        {/* Reference Number */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                <FileText size={16} className="text-purple-400" />
                                Número de Referencia
                            </label>
                            <input
                                type="text"
                                value={formData.reference_number}
                                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                                placeholder="Ej: TRANS-12345"
                                className="w-full bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Notas
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            placeholder="Notas adicionales sobre el pago..."
                            className="w-full bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all duration-200 active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || formData.amount <= 0 || formData.amount > maxAmount}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-semibold shadow-xl shadow-emerald-500/30 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Guardando...' : 'Registrar Pago'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
