'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, ShieldCheck, Loader2, AlertCircle, Clock } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface TicketInfo {
  ticket_number: string;
  requester_name: string;
  description: string;
  validation_deadline: string | null;
  status: string;
}

type Step = 'loading' | 'choose' | 'comment' | 'submitting' | 'done' | 'error' | 'invalid';

export default function ValidateTicketPage() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const initialAction = searchParams.get('action') as 'approved' | 'rejected' | null;

  const [step, setStep] = useState<Step>('loading');
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
  const [action, setAction] = useState<'approved' | 'rejected' | null>(initialAction);
  const [comment, setComment] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/api/portal/tickets/validate/${token}`)
      .then(res => {
        setTicketInfo(res.data);
        setStep(initialAction ? 'comment' : 'choose');
      })
      .catch(err => {
        if (err.response?.status === 404) {
          setStep('invalid');
        } else {
          setErrorMessage(err.response?.data?.message || 'Error al cargar el ticket');
          setStep('error');
        }
      });
  }, [token]);

  const handleSubmit = async () => {
    if (action === 'rejected' && !comment.trim()) return;
    setStep('submitting');
    try {
      const res = await axios.post(`${API_URL}/api/portal/tickets/validate/${token}`, {
        action,
        comment: comment.trim() || null,
      });
      setResultMessage(res.data.message);
      setStep('done');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMessage(e.response?.data?.message || 'Error al procesar la validación');
      setStep('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6" />
            <div>
              <h1 className="font-bold text-lg">Validación de ticket</h1>
              <p className="text-amber-100 text-sm">Sistema de Mesa de Ayuda</p>
            </div>
          </div>
        </div>

        <div className="p-6">

          {/* Loading */}
          {step === 'loading' && (
            <div className="flex flex-col items-center py-8 gap-3 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm">Cargando información del ticket...</p>
            </div>
          )}

          {/* Invalid / expired */}
          {step === 'invalid' && (
            <div className="flex flex-col items-center py-8 gap-3 text-center">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <h2 className="font-semibold text-gray-800">Enlace inválido o expirado</h2>
              <p className="text-sm text-gray-500">
                Este enlace de validación ya no es válido. Es posible que el ticket ya fue procesado o el enlace expiró.
              </p>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="flex flex-col items-center py-8 gap-3 text-center">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <h2 className="font-semibold text-gray-800">Ocurrió un error</h2>
              <p className="text-sm text-gray-500">{errorMessage}</p>
            </div>
          )}

          {/* Ticket info */}
          {ticketInfo && (step === 'choose' || step === 'comment') && (
            <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-800">{ticketInfo.ticket_number}</span>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  Pendiente de validación
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-1">Solicitante: <strong>{ticketInfo.requester_name}</strong></p>
              {ticketInfo.validation_deadline && (
                <div className="flex items-center gap-1 text-xs text-amber-700 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  Plazo: {new Date(ticketInfo.validation_deadline).toLocaleString('es-CO')}
                </div>
              )}
              <p className="mt-3 text-sm text-gray-700 line-clamp-3 leading-relaxed">{ticketInfo.description}</p>
            </div>
          )}

          {/* Choose action */}
          {step === 'choose' && (
            <div>
              <p className="text-sm text-gray-700 mb-4">
                ¿La solución proporcionada por el equipo de soporte fue satisfactoria?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => { setAction('approved'); setStep('comment'); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Sí, todo está correcto
                </button>
                <button
                  onClick={() => { setAction('rejected'); setStep('comment'); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition text-sm"
                >
                  <XCircle className="w-4 h-4" /> No, aún hay problemas
                </button>
              </div>
            </div>
          )}

          {/* Comment & confirm */}
          {step === 'comment' && (
            <div>
              <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg text-sm font-medium ${
                action === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {action === 'approved'
                  ? <><CheckCircle2 className="w-4 h-4" /> Confirmando que la solución fue satisfactoria</>
                  : <><XCircle className="w-4 h-4" /> Reportando que aún hay problemas</>
                }
                <button onClick={() => { setAction(null); setStep('choose'); setComment(''); }} className="ml-auto text-xs underline">
                  Cambiar
                </button>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                {action === 'rejected' ? 'Describe el problema que persiste *' : 'Comentario adicional (opcional)'}
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                rows={4}
                placeholder={
                  action === 'rejected'
                    ? 'Ej: El equipo sigue sin conectarse después de la actualización...'
                    : 'Agrega cualquier observación adicional...'
                }
                value={comment}
                onChange={e => setComment(e.target.value)}
              />

              <button
                onClick={handleSubmit}
                disabled={action === 'rejected' && !comment.trim()}
                className={`mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition disabled:opacity-50 ${
                  action === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {action === 'approved' ? 'Confirmar — todo está correcto' : 'Enviar — reportar problema'}
              </button>
            </div>
          )}

          {/* Submitting */}
          {step === 'submitting' && (
            <div className="flex flex-col items-center py-8 gap-3 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm">Enviando tu respuesta...</p>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              {action === 'approved'
                ? <CheckCircle2 className="w-14 h-14 text-green-500" />
                : <XCircle className="w-14 h-14 text-red-500" />
              }
              <h2 className="font-bold text-gray-800 text-lg">
                {action === 'approved' ? '¡Gracias por confirmar!' : 'Reporte recibido'}
              </h2>
              <p className="text-sm text-gray-600 max-w-xs">{resultMessage}</p>
            </div>
          )}

        </div>

        <div className="px-6 pb-4 text-center text-xs text-gray-400">
          Mesa de Ayuda — Este enlace es de uso único y expirará automáticamente.
        </div>
      </div>
    </div>
  );
}
