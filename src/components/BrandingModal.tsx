import React, { useState, useEffect, useRef } from 'react';
import {
  themeService,
  THEME_PRESETS,
  BrandingTheme,
  ExtractedColor
} from '../services/themeService';
import { sounds } from '../services/soundEffects';
import {
  Palette,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Check,
  RefreshCw,
  X,
  Sliders,
  SlidersHorizontal,
  Building2,
  Eye,
  Tv,
  Layers,
  Award,
  ArrowRight,
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface BrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandingModal: React.FC<BrandingModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'branding' | 'custom'>('branding');
  const [currentTheme, setCurrentTheme] = useState<BrandingTheme>(() => themeService.getActiveTheme());
  
  // Branding inputs
  const [institutionName, setInstitutionName] = useState(currentTheme.institutionName || '');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>(currentTheme.logoUrl || '');
  const [showLogoInNavbar, setShowLogoInNavbar] = useState(currentTheme.showLogoInNavbar ?? true);
  const [showLogoInTv, setShowLogoInTv] = useState(currentTheme.showLogoInTv ?? true);
  
  // Color analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedColors, setExtractedColors] = useState<ExtractedColor[]>([]);
  const [analysisError, setAnalysisError] = useState<string>('');
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  
  // Custom color pickers
  const [customPrimary, setCustomPrimary] = useState(currentTheme.colors.colorPrimary);
  const [customPrimaryHover, setCustomPrimaryHover] = useState(currentTheme.colors.colorPrimaryHover);
  const [customBgMain, setCustomBgMain] = useState(currentTheme.colors.bgMain);
  const [customBgCard, setCustomBgCard] = useState(currentTheme.colors.bgCard);
  const [customBgInput, setCustomBgInput] = useState(currentTheme.colors.bgInput);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = themeService.subscribe((theme) => {
      setCurrentTheme(theme);
      setInstitutionName(theme.institutionName || '');
      setLogoPreviewUrl(theme.logoUrl || '');
      setShowLogoInNavbar(theme.showLogoInNavbar ?? true);
      setShowLogoInTv(theme.showLogoInTv ?? true);
      setCustomPrimary(theme.colors.colorPrimary);
      setCustomPrimaryHover(theme.colors.colorPrimaryHover);
      setCustomBgMain(theme.colors.bgMain);
      setCustomBgCard(theme.colors.bgCard);
      setCustomBgInput(theme.colors.bgInput);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  // Presets
  const handleSelectPreset = (presetId: string) => {
    sounds.playClick();
    themeService.setPreset(presetId, true);
  };

  // Logo File Upload & Trigger Canvas Analysis
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAnalysisError('Por favor selecciona un archivo de imagen válido (PNG, JPG, SVG, WebP).');
      return;
    }

    setAnalysisError('');
    setAnalysisSuccess(false);
    setIsAnalyzing(true);
    sounds.playClick();

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setLogoPreviewUrl(dataUrl);

      try {
        const result = await themeService.analyzeLogoImage(dataUrl);
        setExtractedColors(result.colors);
        setAnalysisSuccess(true);
        sounds.playBelieveChime();
      } catch (err: unknown) {
        setAnalysisError(err instanceof Error ? err.message : 'Error al analizar el logotipo');
        sounds.playBullshitBuzzer();
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Apply automatic brand palette from analyzed logo
  const handleApplyLogoPalette = (primaryHex?: string) => {
    const chosenColor = primaryHex || (extractedColors.length > 0 ? extractedColors[0].hex : customPrimary);
    sounds.playCashAscend(2);

    const generated = themeService.generateThemeFromPrimaryColor(
      chosenColor,
      institutionName.trim(),
      logoPreviewUrl
    );

    generated.showLogoInNavbar = showLogoInNavbar;
    generated.showLogoInTv = showLogoInTv;

    themeService.setTheme(generated);
  };

  // Save institution name and display flags
  const handleSaveBrandingInfo = () => {
    sounds.playClick();
    const updated: BrandingTheme = {
      ...currentTheme,
      institutionName: institutionName.trim(),
      logoUrl: logoPreviewUrl,
      showLogoInNavbar,
      showLogoInTv
    };
    themeService.setTheme(updated);
  };

  // Manual Color Changes
  const handleApplyManualColors = () => {
    sounds.playClick();
    const updated: BrandingTheme = {
      ...currentTheme,
      id: `manual-${Date.now()}`,
      name: institutionName ? `Personalizado: ${institutionName}` : 'Personalizado Manual',
      isCustom: true,
      institutionName: institutionName.trim(),
      logoUrl: logoPreviewUrl,
      showLogoInNavbar,
      showLogoInTv,
      colors: {
        ...currentTheme.colors,
        bgMain: customBgMain,
        bgCard: customBgCard,
        bgInput: customBgInput,
        colorPrimary: customPrimary,
        colorPrimaryHover: customPrimaryHover,
        borderCard: `${customPrimary}55`,
        primaryGlow: `${customPrimary}77`
      }
    };
    themeService.setTheme(updated);
  };

  const handleResetToDefault = () => {
    sounds.playClick();
    themeService.resetToDefault();
    setLogoPreviewUrl('');
    setInstitutionName('');
    setExtractedColors([]);
    setAnalysisSuccess(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl rounded-3xl border shadow-2xl flex flex-col overflow-hidden max-h-[92vh]"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-card)',
          boxShadow: '0 0 50px -10px var(--color-primary-glow)'
        }}
      >
        {/* Modal Header */}
        <div
          className="p-5 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-card)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#050811'
              }}
            >
              <Palette className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Panel del Instructor
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Tema activo: <strong style={{ color: 'var(--color-primary)' }}>{currentTheme.name}</strong>
                </span>
              </div>
              <h2 className="font-display font-black text-xl sm:text-2xl text-white">
                Estilos, Temas Visuales y Modo Branding
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-800/80 gap-2 bg-slate-950/40">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('branding');
            }}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'branding'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Modo Branding & Logo</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('presets');
            }}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Temas Rápidos ({THEME_PRESETS.length})</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('custom');
            }}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'custom'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Ajuste de Variables CSS</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: BRANDING & ANÁLISIS DE LOGO */}
          {activeTab === 'branding' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Institution Name & Branding Meta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    Nombre de la Institución / Empresa / Show
                  </label>
                  <input
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    onBlur={handleSaveBrandingInfo}
                    placeholder="Ej. Colegio San José, TechCorp Summit 2026..."
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white font-semibold outline-none"
                  />
                  <p className="text-[11px] text-slate-400">
                    Aparecerá en el encabezado oficial y en el escenario del concurso.
                  </p>
                </div>

                {/* Display Toggles */}
                <div className="space-y-2.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    Visibilidad del Branding
                  </span>

                  <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                    <span>Mostrar Logo en Barra Superior (Navbar)</span>
                    <input
                      type="checkbox"
                      checked={showLogoInNavbar}
                      onChange={(e) => {
                        setShowLogoInNavbar(e.target.checked);
                        const updated = { ...currentTheme, showLogoInNavbar: e.target.checked };
                        themeService.setTheme(updated);
                      }}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                    <span>Mostrar Logo en Pantalla Principal (Modo TV)</span>
                    <input
                      type="checkbox"
                      checked={showLogoInTv}
                      onChange={(e) => {
                        setShowLogoInTv(e.target.checked);
                        const updated = { ...currentTheme, showLogoInTv: e.target.checked };
                        themeService.setTheme(updated);
                      }}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Logo Upload Box & Canvas Extraction */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-black text-base text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      Logotipo de la Marca / Institución
                    </h3>
                    <p className="text-xs text-slate-400">
                      Sube el escudo o logotipo para analizar sus colores y sincronizar toda la interfaz con tu identidad.
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Subir Imagen</span>
                  </button>
                </div>

                {/* Logo Preview & Analysis Bar */}
                {logoPreviewUrl ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="w-24 h-24 rounded-xl bg-slate-950 p-2 border border-slate-800 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <img
                        src={logoPreviewUrl}
                        alt="Vista previa del logo"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Logotipo cargado correctamente
                        </span>
                        <button
                          onClick={() => {
                            setLogoPreviewUrl('');
                            setExtractedColors([]);
                            setAnalysisSuccess(false);
                            const updated = { ...currentTheme, logoUrl: undefined };
                            themeService.setTheme(updated);
                          }}
                          className="text-[11px] text-red-400 hover:underline cursor-pointer"
                        >
                          Quitar logo
                        </button>
                      </div>

                      <p className="text-xs text-slate-400">
                        El motor de visión de canvas extraerá la paleta de colores dominante y calculará el tono con mayor vibrancia para tu concurso.
                      </p>

                      <button
                        onClick={async () => {
                          setIsAnalyzing(true);
                          setAnalysisError('');
                          try {
                            const res = await themeService.analyzeLogoImage(logoPreviewUrl);
                            setExtractedColors(res.colors);
                            setAnalysisSuccess(true);
                            sounds.playBelieveChime();
                          } catch (err: unknown) {
                            setAnalysisError(err instanceof Error ? err.message : 'Error al analizar');
                          } finally {
                            setIsAnalyzing(false);
                          }
                        }}
                        disabled={isAnalyzing}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all border border-amber-500/40 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                        <span>{isAnalyzing ? 'Analizando píxeles...' : 'Volver a Analizar Colores'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-amber-500/60 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/80 group"
                  >
                    <Upload className="w-8 h-8 text-slate-500 group-hover:text-amber-400 mx-auto mb-2 transition-colors" />
                    <p className="text-sm font-bold text-slate-300 group-hover:text-white">
                      Haz clic para subir el logotipo institucional
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Soporta archivos PNG con fondo transparente, JPG o SVG.
                    </p>
                  </div>
                )}

                {analysisError && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{analysisError}</span>
                  </div>
                )}

                {/* Extracted Colors Grid */}
                {extractedColors.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 space-y-3 animate-in zoom-in-95">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Colores Dominantes Extraídos del Logo:
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Haz clic en un color para usarlo como acento principal
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                      {extractedColors.map((c, idx) => {
                        const isPrimary = currentTheme.colors.colorPrimary.toLowerCase() === c.hex.toLowerCase();
                        return (
                          <button
                            key={c.hex}
                            onClick={() => handleApplyLogoPalette(c.hex)}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer group ${
                              isPrimary
                                ? 'bg-slate-950 border-white ring-2 ring-white scale-105 shadow-lg'
                                : 'bg-slate-950/90 border-slate-800 hover:border-slate-700 hover:scale-102'
                            }`}
                          >
                            <span
                              className="w-8 h-8 rounded-lg shadow border border-white/20 transition-transform group-hover:scale-110"
                              style={{ backgroundColor: c.hex }}
                            />
                            <div className="leading-tight">
                              <span className="text-[11px] font-mono font-bold text-slate-200 block">
                                {c.hex}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {idx === 0 ? '★ Recomendado' : `Tono ${idx + 1}`}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick Apply Button */}
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleApplyLogoPalette()}
                        className="py-2.5 px-5 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:scale-102"
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: '#050811'
                        }}
                      >
                        <Sparkles className="w-4 h-4 fill-current" />
                        <span>Aplicar Paleta Institucional Completa</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PRESETS VISUALES */}
          {activeTab === 'presets' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <p className="text-xs text-slate-400">
                Selecciona una de las combinaciones cromáticas de alta fidelidad para transformar el escenario del concurso en tiempo real:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {THEME_PRESETS.map((preset) => {
                  const isActive = currentTheme.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer group ${
                        isActive
                          ? 'border-white shadow-xl ring-2 ring-white/50 scale-[1.01]'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950'
                      }`}
                      style={{
                        backgroundColor: preset.colors.bgCard
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: preset.colors.colorPrimary }}
                          />
                          <h4 className="font-display font-bold text-sm text-white">
                            {preset.name}
                          </h4>
                        </div>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Check className="w-3 h-3" /> Activo
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        {preset.description}
                      </p>

                      {/* Swatches preview */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                        <div
                          className="w-6 h-4 rounded-md border border-white/10"
                          style={{ backgroundColor: preset.colors.bgMain }}
                          title="Fondo principal"
                        />
                        <div
                          className="w-6 h-4 rounded-md border border-white/10"
                          style={{ backgroundColor: preset.colors.bgCard }}
                          title="Fondo tarjeta"
                        />
                        <div
                          className="w-6 h-4 rounded-md border border-white/10"
                          style={{ backgroundColor: preset.colors.colorPrimary }}
                          title="Acento Primario"
                        />
                        <div
                          className="w-6 h-4 rounded-md border border-white/10"
                          style={{ backgroundColor: preset.colors.colorPrimaryHover }}
                          title="Acento Hover"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: PERSONALIZACIÓN MANUAL DE VARIABLES CSS */}
          {activeTab === 'custom' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <p className="text-xs text-slate-400">
                Ajusta individualmente las variables CSS maestras aplicadas al documento en <code>:root</code>:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Primary Color */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>--color-primary</span>
                    <span className="font-mono text-[11px] text-amber-400">{customPrimary}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customPrimary}
                      onChange={(e) => {
                        setCustomPrimary(e.target.value);
                        themeService.applyToDOM({
                          ...currentTheme,
                          colors: { ...currentTheme.colors, colorPrimary: e.target.value }
                        });
                      }}
                      className="w-10 h-10 rounded-xl border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customPrimary}
                      onChange={(e) => setCustomPrimary(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">Botones principales, acentos y escalera</span>
                </div>

                {/* Primary Hover */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>--color-primary-hover</span>
                    <span className="font-mono text-[11px] text-amber-400">{customPrimaryHover}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customPrimaryHover}
                      onChange={(e) => {
                        setCustomPrimaryHover(e.target.value);
                        themeService.applyToDOM({
                          ...currentTheme,
                          colors: { ...currentTheme.colors, colorPrimaryHover: e.target.value }
                        });
                      }}
                      className="w-10 h-10 rounded-xl border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customPrimaryHover}
                      onChange={(e) => setCustomPrimaryHover(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">Estado hover e interacción</span>
                </div>

                {/* Card Background */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>--bg-card</span>
                    <span className="font-mono text-[11px] text-slate-400">{customBgCard}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customBgCard}
                      onChange={(e) => {
                        setCustomBgCard(e.target.value);
                        themeService.applyToDOM({
                          ...currentTheme,
                          colors: { ...currentTheme.colors, bgCard: e.target.value }
                        });
                      }}
                      className="w-10 h-10 rounded-xl border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customBgCard}
                      onChange={(e) => setCustomBgCard(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">Fondo de paneles y tarjetas</span>
                </div>

                {/* Main Background */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>--bg-main</span>
                    <span className="font-mono text-[11px] text-slate-400">{customBgMain}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customBgMain}
                      onChange={(e) => {
                        setCustomBgMain(e.target.value);
                        themeService.applyToDOM({
                          ...currentTheme,
                          colors: { ...currentTheme.colors, bgMain: e.target.value }
                        });
                      }}
                      className="w-10 h-10 rounded-xl border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customBgMain}
                      onChange={(e) => setCustomBgMain(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">Fondo base del televisor y escenario</span>
                </div>

                {/* Input Background */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>--bg-input</span>
                    <span className="font-mono text-[11px] text-slate-400">{customBgInput}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customBgInput}
                      onChange={(e) => {
                        setCustomBgInput(e.target.value);
                        themeService.applyToDOM({
                          ...currentTheme,
                          colors: { ...currentTheme.colors, bgInput: e.target.value }
                        });
                      }}
                      className="w-10 h-10 rounded-xl border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customBgInput}
                      onChange={(e) => setCustomBgInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">Campos de texto y selectores</span>
                </div>
              </div>

              {/* Live Preview Sample Card */}
              <div
                className="p-4 rounded-2xl border space-y-3"
                style={{
                  backgroundColor: customBgCard,
                  borderColor: `${customPrimary}55`
                }}
              >
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                  Vista Previa en Vivo de Componentes:
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className="px-4 py-2 rounded-xl font-bold text-xs shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${customPrimary}, ${customPrimaryHover})`,
                      color: '#050811'
                    }}
                  >
                    Botón Principal
                  </button>

                  <span
                    className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border"
                    style={{
                      backgroundColor: `${customPrimary}22`,
                      color: customPrimary,
                      borderColor: `${customPrimary}55`
                    }}
                  >
                    Badge Activo
                  </span>

                  <div
                    className="px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold"
                    style={{
                      backgroundColor: customBgInput,
                      borderColor: `${customPrimary}44`,
                      color: '#ffffff'
                    }}
                  >
                    <span>Input Campo</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleApplyManualColors}
                  className="py-2.5 px-6 rounded-xl font-display font-black text-xs uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar y Aplicar Variables</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="p-4 bg-slate-950 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--border-card)' }}
        >
          <button
            onClick={handleResetToDefault}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer Tema Original (Dorado Show)</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer border border-slate-700"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
