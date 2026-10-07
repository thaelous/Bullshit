/**
 * =========================================================================
 * SERVICIO DE TEMAS, BRANDING Y ANÁLISIS DE COLOR DE LOGO
 * =========================================================================
 * Controla las variables CSS dinámicas en :root para personalizar:
 * - Fondos (--bg-main, --bg-card, --bg-input)
 * - Acento de Marca (--color-primary, --color-primary-hover, --color-primary-glow)
 * - Textos (--color-text-main, --color-text-muted)
 * - Bordes (--border-card)
 * - Logo Institucional / Corporativo y Nombre de la Entidad
 * - Extracción y análisis de paleta cromática mediante HTML5 Canvas
 */

export interface ThemeColors {
  bgMain: string;
  bgCard: string;
  bgInput: string;
  colorPrimary: string;
  colorPrimaryHover: string;
  colorTextMain: string;
  colorTextMuted: string;
  borderCard: string;
  primaryGlow: string;
}

export interface BrandingTheme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  institutionName?: string;
  logoUrl?: string;
  showLogoInNavbar?: boolean;
  showLogoInTv?: boolean;
  isCustom?: boolean;
}

export interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  vibrancyScore: number;
  percentage: number;
}

const STORAGE_KEY = 'bullshit_branding_theme_v1';

// Presets de temas visuales cuidadosamente diseñados
export const THEME_PRESETS: BrandingTheme[] = [
  {
    id: 'gold-classic',
    name: 'Dorado Show TV (Clásico)',
    description: 'Estilo clásico de concurso de televisión con destellos dorados y escenario nocturno.',
    colors: {
      bgMain: '#060814',
      bgCard: '#0f1424',
      bgInput: '#090d1a',
      colorPrimary: '#f59e0b',
      colorPrimaryHover: '#d97706',
      colorTextMain: '#f8fafc',
      colorTextMuted: '#94a3b8',
      borderCard: 'rgba(245, 158, 11, 0.35)',
      primaryGlow: 'rgba(245, 158, 11, 0.45)'
    }
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon / Arcade',
    description: 'Estilo futurista de alta energía en tonos cian eléctrico y azul violeta profundo.',
    colors: {
      bgMain: '#050716',
      bgCard: '#0d132c',
      bgInput: '#090d1f',
      colorPrimary: '#06b6d4',
      colorPrimaryHover: '#0891b2',
      colorTextMain: '#f0fdf4',
      colorTextMuted: '#a5b4fc',
      borderCard: 'rgba(6, 182, 212, 0.4)',
      primaryGlow: 'rgba(6, 182, 212, 0.5)'
    }
  },
  {
    id: 'emerald-academy',
    name: 'Esmeralda / Academia',
    description: 'Paleta académica institucional con verde esmeralda y fondos oscuros refinados.',
    colors: {
      bgMain: '#04130d',
      bgCard: '#092419',
      bgInput: '#061811',
      colorPrimary: '#10b981',
      colorPrimaryHover: '#059669',
      colorTextMain: '#f0fdf4',
      colorTextMuted: '#86efac',
      borderCard: 'rgba(16, 185, 129, 0.35)',
      primaryGlow: 'rgba(16, 185, 129, 0.45)'
    }
  },
  {
    id: 'ruby-show',
    name: 'Rubí Intenso / Noche',
    description: 'Estilo dramático y apasionado en rojo carmesí y burdeos profundo para máxima emoción.',
    colors: {
      bgMain: '#140507',
      bgCard: '#240a0f',
      bgInput: '#17060a',
      colorPrimary: '#f43f5e',
      colorPrimaryHover: '#e11d48',
      colorTextMain: '#fff1f2',
      colorTextMuted: '#fda4af',
      borderCard: 'rgba(244, 63, 94, 0.4)',
      primaryGlow: 'rgba(244, 63, 94, 0.5)'
    }
  },
  {
    id: 'sapphire-corp',
    name: 'Zafiro Corporativo',
    description: 'Diseño sobrio y tecnológico ideal para empresas, conferencias y eventos ejecutivos.',
    colors: {
      bgMain: '#050c1e',
      bgCard: '#0c1938',
      bgInput: '#071026',
      colorPrimary: '#3b82f6',
      colorPrimaryHover: '#2563eb',
      colorTextMain: '#eff6ff',
      colorTextMuted: '#93c5fd',
      borderCard: 'rgba(59, 130, 246, 0.35)',
      primaryGlow: 'rgba(59, 130, 246, 0.45)'
    }
  },
  {
    id: 'mystic-purple',
    name: 'Violeta Místico / VIP',
    description: 'Atmósfera premium en púrpura neón y amatista nocturno.',
    colors: {
      bgMain: '#0c0618',
      bgCard: '#190d2e',
      bgInput: '#110920',
      colorPrimary: '#a855f7',
      colorPrimaryHover: '#9333ea',
      colorTextMain: '#faf5ff',
      colorTextMuted: '#d8b4fe',
      borderCard: 'rgba(168, 85, 247, 0.38)',
      primaryGlow: 'rgba(168, 85, 247, 0.48)'
    }
  },
  {
    id: 'obsidian-minimal',
    name: 'Obsidiana & Platino',
    description: 'Monocromático ultra elegante en escala de grises con acento platino brillante.',
    colors: {
      bgMain: '#09090b',
      bgCard: '#18181b',
      bgInput: '#121215',
      colorPrimary: '#e2e8f0',
      colorPrimaryHover: '#cbd5e1',
      colorTextMain: '#ffffff',
      colorTextMuted: '#94a3b8',
      borderCard: 'rgba(226, 232, 240, 0.3)',
      primaryGlow: 'rgba(226, 232, 240, 0.35)'
    }
  }
];

// Helper functions for color conversions
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

class ThemeService {
  private activeTheme: BrandingTheme = THEME_PRESETS[0];
  private listeners: Set<(theme: BrandingTheme) => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as BrandingTheme;
        if (parsed && parsed.colors) {
          this.activeTheme = parsed;
        }
      }
    } catch (err) {
      console.warn('Error loading theme from storage:', err);
    }
    this.applyToDOM(this.activeTheme);
  }

  public getActiveTheme(): BrandingTheme {
    return this.activeTheme;
  }

  public subscribe(listener: (theme: BrandingTheme) => void): () => void {
    this.listeners.add(listener);
    listener(this.activeTheme);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn(this.activeTheme);
      } catch (err) {
        console.error('Error notifying theme listener:', err);
      }
    });
  }

  /**
   * Aplica las variables CSS dinámicas a :root
   */
  public applyToDOM(theme: BrandingTheme) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const { colors } = theme;

    root.style.setProperty('--bg-main', colors.bgMain);
    root.style.setProperty('--bg-card', colors.bgCard);
    root.style.setProperty('--bg-input', colors.bgInput);
    root.style.setProperty('--color-primary', colors.colorPrimary);
    root.style.setProperty('--color-primary-hover', colors.colorPrimaryHover);
    root.style.setProperty('--color-text-main', colors.colorTextMain);
    root.style.setProperty('--color-text-muted', colors.colorTextMuted);
    root.style.setProperty('--border-card', colors.borderCard);
    root.style.setProperty('--color-primary-glow', colors.primaryGlow);
  }

  /**
   * Establece y guarda un nuevo tema
   */
  public setTheme(theme: BrandingTheme) {
    this.activeTheme = theme;
    this.applyToDOM(theme);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
      } catch (err) {
        console.warn('Error saving theme:', err);
      }
    }
    this.notify();
  }

  /**
   * Selecciona uno de los presets predefinidos
   */
  public setPreset(presetId: string, preserveBrandingInfo = true) {
    const found = THEME_PRESETS.find((p) => p.id === presetId);
    if (!found) return;

    const merged: BrandingTheme = {
      ...found,
      institutionName: preserveBrandingInfo ? this.activeTheme.institutionName : undefined,
      logoUrl: preserveBrandingInfo ? this.activeTheme.logoUrl : undefined,
      showLogoInNavbar: preserveBrandingInfo ? this.activeTheme.showLogoInNavbar : true,
      showLogoInTv: preserveBrandingInfo ? this.activeTheme.showLogoInTv : true
    };

    this.setTheme(merged);
  }

  /**
   * Restablece al tema original por defecto
   */
  public resetToDefault() {
    const defaultTheme = { ...THEME_PRESETS[0] };
    this.setTheme(defaultTheme);
  }

  /**
   * Genera un tema completo armónico a partir de un color primario extraído del logo
   */
  public generateThemeFromPrimaryColor(
    primaryHex: string,
    institutionName?: string,
    logoUrl?: string
  ): BrandingTheme {
    const rgb = hexToRgb(primaryHex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Primary hover: ligeramente más oscuro o profundo
    const hoverHsl = { ...hsl, l: Math.max(25, hsl.l - 10) };
    const hoverRgb = hslToRgb(hoverHsl.h, hoverHsl.s, hoverHsl.l);
    const primaryHover = rgbToHex(hoverRgb.r, hoverRgb.g, hoverRgb.b);

    // Fondo principal: muy oscuro con un toque del tono de la marca (tinted dark)
    const bgMainHsl = { h: hsl.h, s: Math.min(35, Math.round(hsl.s * 0.4)), l: 4 };
    const bgMainRgb = hslToRgb(bgMainHsl.h, bgMainHsl.s, bgMainHsl.l);
    const bgMain = rgbToHex(bgMainRgb.r, bgMainRgb.g, bgMainRgb.b);

    // Fondo de tarjetas: oscuro tintado pero claramente distinguible
    const bgCardHsl = { h: hsl.h, s: Math.min(45, Math.round(hsl.s * 0.5)), l: 8 };
    const bgCardRgb = hslToRgb(bgCardHsl.h, bgCardHsl.s, bgCardHsl.l);
    const bgCard = rgbToHex(bgCardRgb.r, bgCardRgb.g, bgCardRgb.b);

    // Fondo de inputs: entre el fondo principal y la tarjeta
    const bgInputHsl = { h: hsl.h, s: Math.min(35, Math.round(hsl.s * 0.4)), l: 6 };
    const bgInputRgb = hslToRgb(bgInputHsl.h, bgInputHsl.s, bgInputHsl.l);
    const bgInput = rgbToHex(bgInputRgb.r, bgInputRgb.g, bgInputRgb.b);

    // Texto atenuado: tinte armónico con alta legibilidad
    const textMutedHsl = { h: hsl.h, s: 20, l: 70 };
    const textMutedRgb = hslToRgb(textMutedHsl.h, textMutedHsl.s, textMutedHsl.l);
    const colorTextMuted = rgbToHex(textMutedRgb.r, textMutedRgb.g, textMutedRgb.b);

    // Bordes y resplandor
    const borderCard = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.38)`;
    const primaryGlow = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.48)`;

    return {
      id: `custom-brand-${Date.now()}`,
      name: institutionName ? `Branding: ${institutionName}` : 'Paleta Institucional Personalizada',
      description: 'Generada automáticamente a partir del análisis cromático del logotipo.',
      isCustom: true,
      institutionName: institutionName || this.activeTheme.institutionName,
      logoUrl: logoUrl || this.activeTheme.logoUrl,
      showLogoInNavbar: this.activeTheme.showLogoInNavbar ?? true,
      showLogoInTv: this.activeTheme.showLogoInTv ?? true,
      colors: {
        bgMain,
        bgCard,
        bgInput,
        colorPrimary: primaryHex,
        colorPrimaryHover: primaryHover,
        colorTextMain: '#f8fafc',
        colorTextMuted,
        borderCard,
        primaryGlow
      }
    };
  }

  /**
   * ANÁLISIS DE LOGO MEDIANTE CANVAS:
   * Extrae los colores más vibrantes y dominantes de la imagen
   */
  public async analyzeLogoImage(imageSource: string | File): Promise<{
    colors: ExtractedColor[];
    dominantColor: string;
    recommendedTheme: BrandingTheme;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      const handleImageLoaded = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('No se pudo inicializar el contexto 2D del canvas');
          }

          // Escala a tamaño manejable (max 120x120) para análisis rápido y representativo
          const maxDim = 120;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          canvas.width = Math.max(1, w);
          canvas.height = Math.max(1, h);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const totalPixels = canvas.width * canvas.height;

          // Agrupación en cubos de color cuantizados
          const colorBuckets: Map<string, { r: number; g: number; b: number; count: number }> = new Map();

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // Ignora píxeles transparentes o semitransparentes
            if (a < 125) continue;

            // Ignora blancos puros y negros absolutos de fondo
            const isNearWhite = r > 245 && g > 245 && b > 245;
            const isNearBlack = r < 20 && g < 20 && b < 20;
            if (isNearWhite || isNearBlack) continue;

            // Cuantización de color a pasos de 16 para agrupar tonos similares
            const quantR = Math.round(r / 16) * 16;
            const quantG = Math.round(g / 16) * 16;
            const quantB = Math.round(b / 16) * 16;
            const key = `${quantR},${quantG},${quantB}`;

            const existing = colorBuckets.get(key);
            if (existing) {
              existing.count++;
            } else {
              colorBuckets.set(key, { r: quantR, g: quantG, b: quantB, count: 1 });
            }
          }

          // Si casi todo era blanco/negro (ej. logo blanco sobre transparente),
          // hacer un segundo escaneo permitiendo colores no transparentes
          if (colorBuckets.size === 0) {
            for (let i = 0; i < data.length; i += 4) {
              const a = data[i + 3];
              if (a < 125) continue;
              const r = Math.round(data[i] / 16) * 16;
              const g = Math.round(data[i + 1] / 16) * 16;
              const b = Math.round(data[i + 2] / 16) * 16;
              const key = `${r},${g},${b}`;
              const existing = colorBuckets.get(key);
              if (existing) existing.count++;
              else colorBuckets.set(key, { r, g, b, count: 1 });
            }
          }

          const parsedList: ExtractedColor[] = [];

          colorBuckets.forEach((item) => {
            const hex = rgbToHex(item.r, item.g, item.b);
            const hsl = rgbToHsl(item.r, item.g, item.b);
            const percentage = (item.count / totalPixels) * 100;

            // Puntuación de vibrancia: premia la saturación y castiga la luminosidad extrema
            // Esto asegura que el color de la marca (ej. rojo, naranja, azul vibrante) sea el primario
            const saturationWeight = (hsl.s / 100) * 2.2;
            const lightnessPenalty = hsl.l < 15 || hsl.l > 88 ? 0.3 : 1.0;
            const frequencyWeight = Math.min(2.0, Math.log10(item.count + 1));
            const vibrancyScore = (saturationWeight + frequencyWeight) * lightnessPenalty;

            parsedList.push({
              hex,
              rgb: { r: item.r, g: item.g, b: item.b },
              hsl,
              vibrancyScore,
              percentage
            });
          });

          // Ordenar por puntuación de vibrancia primero, luego por frecuencia
          parsedList.sort((a, b) => b.vibrancyScore - a.vibrancyScore);

          // Filtrar colores extremadamente cercanos entre sí
          const uniqueColors: ExtractedColor[] = [];
          for (const c of parsedList) {
            const isSimilar = uniqueColors.some((existing) => {
              const diffH = Math.abs(existing.hsl.h - c.hsl.h);
              const diffL = Math.abs(existing.hsl.l - c.hsl.l);
              return diffH < 22 && diffL < 20;
            });
            if (!isSimilar) {
              uniqueColors.push(c);
            }
            if (uniqueColors.length >= 6) break;
          }

          // Si tras filtrar la lista está vacía, usar el dorado predeterminado
          const fallbackHex = '#f59e0b';
          const dominantColor = uniqueColors.length > 0 ? uniqueColors[0].hex : fallbackHex;

          const imageSrcString = typeof imageSource === 'string' ? imageSource : '';
          const recommendedTheme = this.generateThemeFromPrimaryColor(
            dominantColor,
            this.activeTheme.institutionName,
            imageSrcString
          );

          resolve({
            colors: uniqueColors,
            dominantColor,
            recommendedTheme
          });
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('No se pudo cargar la imagen para su análisis cromático.'));
      };

      img.onload = handleImageLoaded;

      if (typeof imageSource === 'string') {
        img.src = imageSource;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            img.src = e.target.result as string;
          }
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'));
        reader.readAsDataURL(imageSource);
      }
    });
  }
}

export const themeService = new ThemeService();
