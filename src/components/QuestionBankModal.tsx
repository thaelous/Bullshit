import React, { useState, useEffect, useRef } from 'react';
import { QuestionSet, Question, Room } from '../types';
import { TRIVIA_QUESTIONS } from '../data/questions';
import { downloadExcelTemplate, parseExcelFile } from '../services/excelService';
import { gameService } from '../services/gameSync';
import { sounds } from '../services/soundEffects';
import {
  FileSpreadsheet,
  Download,
  Upload,
  X,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Check,
  Plus
} from 'lucide-react';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  isHost: boolean;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  isOpen,
  onClose,
  room,
  isHost
}) => {
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Upload dialog state
  const [parsedQuestions, setParsedQuestions] = useState<Question[] | null>(null);
  const [setNameInput, setSetNameInput] = useState('');
  const [previewingSet, setPreviewingSet] = useState<QuestionSet | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe in real-time to Firestore collection `questionSets`
  useEffect(() => {
    if (!isOpen) return;
    const unsub = gameService.subscribeQuestionSets((sets) => {
      setQuestionSets(sets);
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSelectedSetName = room.questionSetName || 'Preguntas Clásicas (Default)';

  const handleDownloadTemplate = () => {
    sounds.playClick();
    downloadExcelTemplate();
    setSuccessMsg('Plantilla Excel descargada exitosamente.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const result = await parseExcelFile(file);
      setParsedQuestions(result.questions);
      // Derive default set name from filename
      const defaultName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/_/g, ' ')
        .replace(/plantilla/i, 'Trivia')
        .trim();
      setSetNameInput(defaultName || 'Mi Set de Preguntas');
      sounds.playTruthChime();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al procesar el archivo Excel.');
      sounds.playBullshitBuzzer();
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmSaveSet = async () => {
    if (!parsedQuestions || !setNameInput.trim()) return;
    setLoading(true);
    setErrorMsg('');

    try {
      sounds.playClick();
      const newSet = await gameService.saveQuestionSet(setNameInput.trim(), parsedQuestions);

      // Automatically apply this newly uploaded set to the current room!
      await gameService.setRoomQuestionSet(room.roomCode, newSet.name, newSet.questions);

      setSuccessMsg(`¡Set "${newSet.name}" (${newSet.questionCount} preguntas) guardado en Firestore y aplicado a la sala!`);
      setParsedQuestions(null);
      setSetNameInput('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar en Firestore');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSet = async (setName: string) => {
    sounds.playClick();
    if (setName === 'default') {
      await gameService.setRoomQuestionSet(room.roomCode, 'Preguntas Clásicas (Default)', null);
      setSuccessMsg('Se aplicó el set de Preguntas Clásicas por defecto.');
    } else {
      const target = questionSets.find((s) => s.id === setName || s.name === setName);
      if (target) {
        await gameService.setRoomQuestionSet(room.roomCode, target.name, target.questions);
        setSuccessMsg(`Se aplicó el set "${target.name}" (${target.questionCount} preguntas).`);
      }
    }
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteSet = async (setId: string, setName: string) => {
    if (!confirm(`¿Eliminar definitivamente el set de preguntas "${setName}" de Firestore?`)) return;
    try {
      sounds.playClick();
      await gameService.deleteQuestionSet(setId);
      // If current room was using this deleted set, revert to default
      if (room.questionSetName === setName) {
        await gameService.setRoomQuestionSet(room.roomCode, 'Preguntas Clásicas (Default)', null);
      }
      setSuccessMsg(`Set "${setName}" eliminado de Firestore.`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-3xl bg-slate-900 border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 text-slate-950 font-black shadow-lg">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display font-black text-xl sm:text-2xl text-white">
                Banco de Preguntas y Plantillas Excel
              </h2>
              <p className="text-xs text-slate-400">
                Sube tus propias preguntas con SheetJS o usa las plantillas guardadas en Firestore
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Notifications */}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Actions: Download Template & Upload Button */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Download Template Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                  <Download className="w-4 h-4" />
                  <span>Descargar Plantilla Base</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Archivo <code>.xlsx</code> prediseñado con las columnas exactas (pregunta, 4 opciones, respuesta correcta y curiosidad) con 3 ejemplos listos.
                </p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                Descargar Plantilla Base (.xlsx)
              </button>
            </div>

            {/* Upload File Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                  <Upload className="w-4 h-4" />
                  <span>Subir Plantilla Excel</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Carga tus preguntas desde un archivo Excel. Se validarán los campos y se guardarán en tu base de datos de Firestore en <code>questionSets</code>.
                </p>
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls"
                  className="hidden"
                  id="excelFileInput"
                />
                <label
                  htmlFor="excelFileInput"
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 glow-gold transition-all shadow-md"
                >
                  <Upload className="w-4 h-4" />
                  {loading ? 'Procesando...' : 'Subir Plantilla Excel (.xlsx)'}
                </label>
              </div>
            </div>
          </div>

          {/* Modal sub-step: Name and Save Uploaded Set */}
          {parsedQuestions && (
            <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-900 border-2 border-amber-500/60 shadow-xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  <h3 className="font-display font-black text-lg text-white">
                    ¡Archivo leído con éxito! ({parsedQuestions.length} preguntas válidas)
                  </h3>
                </div>
                <button
                  onClick={() => setParsedQuestions(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Asigna un Nombre a este Set de Preguntas
                </label>
                <input
                  type="text"
                  value={setNameInput}
                  onChange={(e) => setSetNameInput(e.target.value)}
                  placeholder="Ej. Cultura Pop, Ciencia Extrema, Historia Secreta..."
                  maxLength={60}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white font-semibold outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400">
                  Se guardará en la colección <code className="text-amber-300">questionSets</code> de Firestore.
                </span>
                <button
                  onClick={handleConfirmSaveSet}
                  disabled={loading || !setNameInput.trim()}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all glow-green shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Guardar y Usar en la Partida
                </button>
              </div>
            </div>
          )}

          {/* Sets Selection and Management Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display font-black text-base text-white uppercase tracking-wider">
                  Plantillas Disponibles en Firestore
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Seleccionado actualmente: <strong className="text-amber-400">{currentSelectedSetName}</strong>
              </span>
            </div>

            {/* List of sets */}
            <div className="space-y-2.5">
              {/* Default Classic Set */}
              <div
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  !room.customQuestions || room.questionSetName === 'Preguntas Clásicas (Default)'
                    ? 'bg-amber-950/30 border-amber-400/80 shadow-md ring-1 ring-amber-400/40'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                    ⭐
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">
                        Preguntas Clásicas (Default)
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {TRIVIA_QUESTIONS.length} preguntas
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Trivia contraintuitiva de ciencia, historia, animales y cultura general incluida con el juego.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setPreviewingSet({
                        id: 'default',
                        name: 'Preguntas Clásicas (Default)',
                        createdAt: 0,
                        questionCount: TRIVIA_QUESTIONS.length,
                        questions: TRIVIA_QUESTIONS,
                      })
                    }
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Previsualizar preguntas"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleSelectSet('default')}
                    disabled={!room.customQuestions}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                      !room.customQuestions
                        ? 'bg-amber-500 text-slate-950 shadow-sm cursor-default'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {!room.customQuestions ? '✓ Activo' : 'Activar Set'}
                  </button>
                </div>
              </div>

              {/* Uploaded Sets from Firestore */}
              {questionSets.map((set) => {
                const isActive = room.questionSetName === set.name;
                return (
                  <div
                    key={set.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-amber-950/30 border-amber-400/80 shadow-md ring-1 ring-amber-400/40'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                        📊
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{set.name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                            {set.questionCount} preguntas
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Subido el {new Date(set.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewingSet(set)}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Ver preguntas de este set"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteSet(set.id, set.name)}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-red-950/50 text-slate-400 hover:text-red-400 transition-colors"
                        title="Eliminar de Firestore"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleSelectSet(set.id)}
                        disabled={isActive}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 shadow-sm cursor-default'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {isActive ? '✓ Activo' : 'Activar Set'}
                      </button>
                    </div>
                  </div>
                );
              })}

              {questionSets.length === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  No hay plantillas personalizadas subidas aún. Puedes descargar la plantilla arriba y cargar tus preguntas en formato Excel.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            El set activo se sincroniza en tiempo real para todos los concursantes de la sala.
          </span>
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>

      {/* Preview Sub-modal */}
      {previewingSet && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-display font-black text-lg text-white">
                  Previsualización: {previewingSet.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {previewingSet.questionCount} preguntas en este set
                </p>
              </div>
              <button
                onClick={() => setPreviewingSet(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {previewingSet.questions.map((q, idx) => (
                <div key={q.id || idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-300">
                    <span>#{idx + 1}. {q.question}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Correcta: {q.correctOption}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-slate-400 text-[11px]">
                    <div>A: {q.options.A}</div>
                    <div>B: {q.options.B}</div>
                    <div>C: {q.options.C}</div>
                    <div>D: {q.options.D}</div>
                  </div>
                  {q.explanation && (
                    <p className="text-[11px] text-amber-300/80 italic">
                      Dato: {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewingSet(null)}
                className="py-2 px-4 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200"
              >
                Cerrar Previsualización
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
