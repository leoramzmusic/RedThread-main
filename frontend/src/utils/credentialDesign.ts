// Carga el diseño de credencial guardado en EmployeeIdDesign y lo adapta a props de CredentialCard/Back.
// Prioridad: borrador localStorage → archivo nominado más reciente del servidor.

export type CredentialDesignConfig = Record<string, unknown>;

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const DRAFT_KEY = 'reth-credential-config';

function readDraft(): CredentialDesignConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function readServerLatest(): Promise<CredentialDesignConfig | null> {
  try {
    const listRes = await fetch(`${API}/portal-redthread/credenciales/list`, { credentials: 'include' });
    if (!listRes.ok) return null;
    const files: { name: string; url: string; modified: string }[] = await listRes.json();
    const designs = (files || [])
      .filter((f) => f.name.startsWith('credential_design_') && f.name.endsWith('.json'))
      .sort((a, b) => (a.modified < b.modified ? 1 : -1));
    if (!designs.length) return null;
    const cfgRes = await fetch(`${API}${designs[0].url}`, { credentials: 'include' });
    if (!cfgRes.ok) return null;
    return await cfgRes.json();
  } catch {
    return null;
  }
}

/** Devuelve el cfg de diseño más fresco disponible (draft si es más nuevo o no hay servidor). */
export async function loadCredentialDesign(): Promise<CredentialDesignConfig> {
  const draft = readDraft() || {};
  const server = await readServerLatest();
  if (!server) return draft;
  const draftAt = Date.parse(String(draft.updatedAt || '')) || 0;
  const serverAt = Date.parse(String(server.updatedAt || '')) || 0;
  // Mezcla: servidor base + campos del draft si el draft es más reciente
  if (draftAt >= serverAt) return { ...server, ...draft };
  return { ...draft, ...server };
}

/** Props de frente (CredentialCard) a partir del cfg del editor. */
export function cardPropsFromDesign(cfg: CredentialDesignConfig): Record<string, unknown> {
  const g = <T,>(k: string, fallback?: T): T | undefined =>
    cfg[k] !== undefined && cfg[k] !== null ? (cfg[k] as T) : fallback;
  return {
    logoUrl: g<string>('logoUrl'),
    logoSize: g<number>('logoSize'),
    taglineTitle: g<string>('taglineTitle'),
    taglineSubtitle: g<string>('taglineSubtitle'),
    logoPos: g<string>('logoPos'),
    taglineTitleSize: g<number>('taglineTitleSize'),
    taglineSubtitleSize: g<number>('taglineSubtitleSize'),
    photoShape: g<'circle' | 'square' | 'diamond'>('photoShape'),
    photoBorderWidth: g<number>('photoBorderWidth'),
    photoBorderColor: g<string>('photoBorderColor'),
    photoBg: g<'white' | 'gray' | 'transparent'>('photoBg'),
    photoShadow: g<boolean>('photoShadow'),
    fontFamily: g<string>('font'),
    boldName: g<boolean>('boldName'),
    nameWeight: g<number>('nameWeight'),
    italicRole: g<boolean>('italicRole'),
    nameSize: g<number>('nameSize'),
    roleSize: g<number>('roleSize'),
    nameColor: g<string>('nameColor'),
    roleColor: g<string>('roleColor'),
    nameCase: g<'uppercase' | 'capitalize' | 'none'>('nameCase'),
    textAlign: g<'center' | 'left' | 'right'>('textAlign'),
    autoFitText: g<boolean>('autoFitText'),
    showDivider: g<boolean>('showDivider'),
    showDOB: g<boolean>('showDOB'),
    showPhone: g<boolean>('showPhone'),
    showEmail: g<boolean>('showEmail'),
    showID: g<boolean>('showID'),
    showName: g<boolean>('showName'),
    showSerial: g<boolean>('showSerial'),
    showSeal: g<boolean>('showSeal'),
    topText: g<string>('topText'),
    primary: g<string>('primary'),
    secondary: g<string>('secondary'),
    accent: g<string>('accent'),
    template: g<string>('template'),
    decorLines: g<boolean>('decorLines'),
    decorThickness: g<number>('decorThickness'),
    decorPos: g<'header' | 'franja' | 'diagonal' | 'marco'>('decorPos'),
    cardBgMode: g<'solid' | 'gradient' | 'pattern'>('cardBgMode'),
    watermarkUrl: g<string>('watermarkUrl'),
    watermarkOpacity: g<number>('watermarkOpacity'),
    marginX: g<number>('marginX'),
    contentGap: g<number>('contentGap'),
    digitalDark: g<boolean>('digitalDark'),
  };
}

/** Props de reverso (CredentialBack) a partir del cfg del editor. */
export function backPropsFromDesign(cfg: CredentialDesignConfig): Record<string, unknown> {
  const g = <T,>(k: string, fallback?: T): T | undefined =>
    cfg[k] !== undefined && cfg[k] !== null ? (cfg[k] as T) : fallback;
  return {
    logoUrl: g<string>('logoUrl'),
    logoSize: g<number>('logoSize'),
    taglineTitle: g<string>('taglineTitle'),
    taglineSubtitle: g<string>('taglineSubtitle'),
    logoPos: g<string>('logoPos'),
    taglineTitleSize: g<number>('taglineTitleSize'),
    taglineSubtitleSize: g<number>('taglineSubtitleSize'),
    showQR: g<boolean>('showQR'),
    qrSize: g<number>('qrSize'),
    qrPos: g<'inferior-derecha' | 'inferior-izquierda' | 'centro'>('qrPos'),
    qrUrl: g<string>('qrUrl'),
    showDates: g<boolean>('showDates'),
    dateFormat: g<'DD/MM/YYYY' | 'MM/DD/YYYY'>('dateFormat'),
    showSerial: g<boolean>('showSerial'),
    backTextTop: g<string>('backTextTop'),
    backTextMid: g<string>('backTextMid'),
    backTextBot: g<string>('backTextBot'),
    backLang: g<'en' | 'es'>('backLang'),
    primary: g<string>('primary'),
    secondary: g<string>('secondary'),
    accent: g<string>('accent'),
    digitalDark: g<boolean>('digitalDark'),
  };
}
