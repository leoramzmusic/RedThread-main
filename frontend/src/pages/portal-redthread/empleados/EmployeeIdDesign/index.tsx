import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Box, Container, Typography, Paper, Grid, Tabs, Tab, TextField, FormControl,
  InputLabel, Select, MenuItem, Switch, FormControlLabel, Button, Divider, Alert,
  Chip, Slider, SvgIcon, ToggleButton, ToggleButtonGroup, Tooltip
} from '@mui/material';
import {
  Save as SaveIcon, Palette as PaletteIcon, TextFields as TextIcon, Image as ImageIcon,
  ViewModule as ViewIcon, History as HistoryIcon, GetApp as ExportIcon, PhotoCamera as PhotoIcon,
  WarningAmber as WarnIcon, FormatBold as BoldIcon, FormatItalic as ItalicIcon,
  FormatAlignLeft as AlignLeftIcon, FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon, AutoFixHigh as AutoFixIcon, Style as StyleIcon,
  Translate as TranslateIcon, Spellcheck as SpellcheckIcon
} from '@mui/icons-material';
import AdminLayout from '@/components/layout/AdminLayout';
import CredentialCard from '@/components/admin/CredentialCard';
import CredentialBack from '@/components/admin/CredentialBack';

const TEMPLATES = [
  { id: 'geometrico', label: 'Geométrico', desc: 'Diagonal rojo/azul, diamante' },
  { id: 'minimalista', label: 'Minimalista', desc: 'Limpio, sin patrones' },
  { id: 'corporativo', label: 'Corporativo', desc: 'Franjas sólidas, serio' },
];

const FONTS = ['Inter', 'Roboto', 'Montserrat', 'Poppins', 'Outfit', 'Open Sans', 'Nunito', 'Lato'];

const CORPORATE_COLORS = [
  { label: 'Rojo ReTh', value: '#E63946' },
  { label: 'Negro Profundo', value: '#111827' },
  { label: 'Azul Marino', value: '#0f1f3a' },
  { label: 'Gris Oscuro', value: '#4B5563' },
  { label: 'Gris Medio', value: '#6B7280' },
  { label: 'Azul Royal', value: '#2563EB' },
];

interface TypoPreset {
  name: string;
  font: string;
  boldName: boolean;
  nameWeight: number;
  italicRole: boolean;
  nameSize: number;
  roleSize: number;
  nameColor: string;
  roleColor: string;
  textAlign: 'center' | 'left' | 'right';
  autoFitText: boolean;
  showDivider: boolean;
  nameCase: 'uppercase' | 'capitalize' | 'none';
}

const TYPO_PRESETS: TypoPreset[] = [
  {
    name: 'ReTh Corporativo',
    font: 'Inter',
    boldName: true,
    nameWeight: 800,
    italicRole: true,
    nameSize: 3.1,
    roleSize: 1.9,
    nameColor: '#E63946',
    roleColor: '#6B7280',
    textAlign: 'center',
    autoFitText: true,
    showDivider: true,
    nameCase: 'uppercase',
  },
  {
    name: 'Ejecutivo Dark',
    font: 'Montserrat',
    boldName: true,
    nameWeight: 700,
    italicRole: false,
    nameSize: 3.2,
    roleSize: 1.8,
    nameColor: '#111827',
    roleColor: '#4B5563',
    textAlign: 'center',
    autoFitText: true,
    showDivider: true,
    nameCase: 'uppercase',
  },
  {
    name: 'Navy Modern',
    font: 'Outfit',
    boldName: true,
    nameWeight: 700,
    italicRole: true,
    nameSize: 3.3,
    roleSize: 2.0,
    nameColor: '#0f1f3a',
    roleColor: '#E63946',
    textAlign: 'center',
    autoFitText: true,
    showDivider: true,
    nameCase: 'capitalize',
  },
  {
    name: 'Minimal Clean',
    font: 'Roboto',
    boldName: true,
    nameWeight: 600,
    italicRole: false,
    nameSize: 2.9,
    roleSize: 1.8,
    nameColor: '#1f2937',
    roleColor: '#9ca3af',
    textAlign: 'center',
    autoFitText: true,
    showDivider: false,
    nameCase: 'uppercase',
  },
];

const TEST_NAMES = [
  { id: 'standard', label: 'Estándar', first: 'Maria', last: 'Smith', role: 'Graphic Designer', roleEs: 'Diseñadora Gráfica', dept: 'Design' },
  { id: 'short', label: 'Nombre Corto', first: 'Ana', last: 'Cruz', role: 'HR Lead', roleEs: 'Líder de RRHH', dept: 'People' },
  { id: 'long', label: 'Nombre Largo (Anti-Desborde)', first: 'Maximiliano Fco.', last: 'De La Rosa Valenzuela', role: 'VP of Technology & Architecture', roleEs: 'VP de Tecnología & Arquitectura', dept: 'Engineering' },
];

export default function EmployeeIdDesignPage() {
  const [tab, setTab] = useState(0);
  const [template, setTemplate] = useState('geometrico');
  const [primary, setPrimary] = useState('#E63946');
  const [secondary, setSecondary] = useState('#0f1f3a');
  const [accent, setAccent] = useState('#3B82F6');
  const [decorLines, setDecorLines] = useState(true);
  const [decorThickness, setDecorThickness] = useState(3);
  const [decorPos, setDecorPos] = useState<'header' | 'franja' | 'diagonal' | 'marco'>('header');
  const [cardBgMode, setCardBgMode] = useState<'solid' | 'gradient' | 'pattern'>('solid');
  const [watermarkUrl, setWatermarkUrl] = useState<string | null>(null);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.08);
  const [marginX, setMarginX] = useState(8.8);
  const [contentGap, setContentGap] = useState(0.8);
  const [digitalDark, setDigitalDark] = useState(false);
  const [visualPresetName, setVisualPresetName] = useState('');
  const [visualPresets, setVisualPresets] = useState<{ name: string; cfg: Record<string, unknown> }[]>([]);
  const [designName, setDesignName] = useState('Diseño principal');
  const [savedDesigns, setSavedDesigns] = useState<{ name: string; url: string; size: number; modified: string }[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Tipografía avanzada
  const [font, setFont] = useState('Inter');
  const [boldName, setBoldName] = useState(true);
  const [nameWeight, setNameWeight] = useState(800);
  const [italicRole, setItalicRole] = useState(true);
  const [nameSize, setNameSize] = useState(3.1);
  const [roleSize, setRoleSize] = useState(1.9);
  const [nameColor, setNameColor] = useState('#E63946');
  const [roleColor, setRoleColor] = useState('#6B7280');
  const [nameCase, setNameCase] = useState<'uppercase' | 'capitalize' | 'none'>('uppercase');
  const [textAlign, setTextAlign] = useState<'center' | 'left' | 'right'>('center');
  const [autoFitText, setAutoFitText] = useState(true);
  const [showDivider, setShowDivider] = useState(true);
  const [testNameMode, setTestNameMode] = useState<'standard' | 'short' | 'long'>('standard');
  const [langRole, setLangRole] = useState<'es' | 'en'>('en');

  // Logo y Taglines
  const [logoPos, setLogoPos] = useState('superior');
  const [taglineTitle, setTaglineTitle] = useState('RETH');
  const [taglineSubtitle, setTaglineSubtitle] = useState('Internal Access System');
  const [taglineTitleSize, setTaglineTitleSize] = useState(2);
  const [taglineSubtitleSize, setTaglineSubtitleSize] = useState(1.2);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(5);

  // Elementos de credencial
  const [showDOB, setShowDOB] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showID, setShowID] = useState(true);
  const [showName, setShowName] = useState(true);
  const [showSerial, setShowSerial] = useState(true);
  const [serialWhere, setSerialWhere] = useState<'none' | 'front' | 'back' | 'both'>('back');
  const [qrSize, setQrSize] = useState(20);
  const [qrPos, setQrPos] = useState<'inferior-derecha' | 'inferior-izquierda' | 'centro'>('centro');
  const [showQR, setShowQR] = useState(true);
  const [qrUrl, setQrUrl] = useState('https://reth.app/verify');
  const [topText, setTopText] = useState('Valid with official photo');
  const [showSeal, setShowSeal] = useState(true);
  const [showDates, setShowDates] = useState(true);
  const [dateFormat, setDateFormat] = useState<'DD/MM/YYYY' | 'MM/DD/YYYY'>('DD/MM/YYYY');
  const [backTextTop, setBackTextTop] = useState('');
  const [backTextMid, setBackTextMid] = useState('');
  const [backTextBot, setBackTextBot] = useState('');
  const [backLang, setBackLang] = useState<'en' | 'es'>('en');
  const [previewVersion, setPreviewVersion] = useState('v1');
  const [saved, setSaved] = useState(false);

  // Foto marco
  const [photoShape, setPhotoShape] = useState<'circle' | 'square' | 'diamond'>('circle');
  const [photoBorderWidth, setPhotoBorderWidth] = useState(3);
  const [photoBorderColor, setPhotoBorderColor] = useState('#ffffff');
  const [photoBg, setPhotoBg] = useState<'white' | 'gray' | 'transparent'>('white');
  const [photoShadow, setPhotoShadow] = useState(true);
  const hasPreviewPhoto = false;

  // Contraste WCAG (rel luminance) — texto blanco sobre primary/secondary
  const relLum = (hex: string) => {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const r = parseInt(full.slice(0, 2), 16) / 255;
    const g = parseInt(full.slice(2, 4), 16) / 255;
    const b = parseInt(full.slice(4, 6), 16) / 255;
    const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrastRatio = (a: string, b: string) => {
    const l1 = relLum(a);
    const l2 = relLum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const whiteOnPrimary = contrastRatio(primary, '#ffffff');
  const whiteOnSecondary = contrastRatio(secondary, '#ffffff');
  const contrastOk = whiteOnPrimary >= 4.5 && whiteOnSecondary >= 4.5;

  const applyVisual = (v: {
    template?: string; primary?: string; secondary?: string; accent?: string;
    decorLines?: boolean; decorThickness?: number; decorPos?: typeof decorPos;
    cardBgMode?: typeof cardBgMode; watermarkUrl?: string | null; watermarkOpacity?: number;
    marginX?: number; contentGap?: number; digitalDark?: boolean;
  }) => {
    if (v.template) { setTemplate(v.template); logAudit('set', 'template'); }
    if (v.primary) { setPrimary(v.primary); logAudit('set', 'primary'); }
    if (v.secondary) setSecondary(v.secondary);
    if (v.accent) setAccent(v.accent);
    if (typeof v.decorLines === 'boolean') setDecorLines(v.decorLines);
    if (typeof v.decorThickness === 'number') setDecorThickness(v.decorThickness);
    if (v.decorPos) setDecorPos(v.decorPos);
    if (v.cardBgMode) setCardBgMode(v.cardBgMode);
    if (v.watermarkUrl !== undefined) setWatermarkUrl(v.watermarkUrl);
    if (typeof v.watermarkOpacity === 'number') setWatermarkOpacity(v.watermarkOpacity);
    if (typeof v.marginX === 'number') setMarginX(v.marginX);
    if (typeof v.contentGap === 'number') setContentGap(v.contentGap);
    if (typeof v.digitalDark === 'boolean') setDigitalDark(v.digitalDark);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('reth-visual-presets');
      if (raw) setVisualPresets(JSON.parse(raw));
    } catch {}
  }, []);

  const getVisualCfg = () => ({
    template, primary, secondary, accent, decorLines, decorThickness, decorPos,
    cardBgMode, watermarkUrl, watermarkOpacity, marginX, contentGap, digitalDark,
  });

  const saveVisualPreset = () => {
    const name = visualPresetName.trim();
    if (!name) return;
    const next = [...visualPresets.filter((p) => p.name !== name), { name, cfg: getVisualCfg() }];
    setVisualPresets(next);
    localStorage.setItem('reth-visual-presets', JSON.stringify(next));
    setVisualPresetName('');
    logAudit('save-preset', name);
  };

  const loadVisualPreset = (name: string) => {
    const p = visualPresets.find((x) => x.name === name);
    if (p) { applyVisual(p.cfg); logAudit('load-preset', name); }
  };

  const requiredWarning = !showName || !showID || !hasPreviewPhoto;

  const ELEMENT_DEFAULTS: {
    showDOB: boolean; showPhone: boolean; showEmail: boolean; showID: boolean; showName: boolean;
    showSerial: boolean; serialWhere: 'none' | 'front' | 'back' | 'both';
    showQR: boolean; qrSize: number;
    qrPos: 'inferior-derecha' | 'inferior-izquierda' | 'centro'; qrUrl: string;
    topText: string; showSeal: boolean; showDates: boolean;
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
    backTextTop: string; backTextMid: string; backTextBot: string;
    backLang: 'en' | 'es';
  } = {
    showDOB: true, showPhone: true, showEmail: true, showID: true, showName: true,
    showSerial: true, serialWhere: 'back', showQR: true, qrSize: 20,
    qrPos: 'centro', qrUrl: 'https://reth.app/verify',
    topText: 'Valid with official photo', showSeal: true, showDates: true,
    dateFormat: 'DD/MM/YYYY', backTextTop: '', backTextMid: '', backTextBot: '',
    backLang: 'en',
  };
  const BUILTIN_PRESETS: { name: string; cfg: Partial<typeof ELEMENT_DEFAULTS> }[] = [
    { name: 'Staff', cfg: { ...ELEMENT_DEFAULTS } },
    { name: 'Visitor', cfg: { showDOB: false, showPhone: false, showEmail: false, showSeal: false, showSerial: false, serialWhere: 'none', showDates: false, topText: 'VISITOR — NOT TRANSFERABLE' } },
    { name: 'Contractor', cfg: { showDOB: false, showPhone: false, showEmail: true, showSeal: true, showSerial: true, serialWhere: 'both', showDates: true, topText: 'CONTRACTOR ACCESS' } },
  ];

  const getElementCfg = () => ({
    showDOB, showPhone, showEmail, showID, showName, showSerial, serialWhere,
    showQR, qrSize, qrPos, qrUrl, topText, showSeal, showDates, dateFormat,
    backTextTop, backTextMid, backTextBot, backLang,
  });

  const applyElementCfg = (cfg: Partial<typeof ELEMENT_DEFAULTS>) => {
    if (typeof cfg.showDOB === 'boolean') setShowDOB(cfg.showDOB);
    if (typeof cfg.showPhone === 'boolean') setShowPhone(cfg.showPhone);
    if (typeof cfg.showEmail === 'boolean') setShowEmail(cfg.showEmail);
    if (typeof cfg.showID === 'boolean') setShowID(cfg.showID);
    if (typeof cfg.showName === 'boolean') setShowName(cfg.showName);
    if (typeof cfg.showSerial === 'boolean') setShowSerial(cfg.showSerial);
    if (cfg.serialWhere) setSerialWhere(cfg.serialWhere);
    if (typeof cfg.showQR === 'boolean') setShowQR(cfg.showQR);
    if (typeof cfg.qrSize === 'number') setQrSize(cfg.qrSize);
    if (cfg.qrPos) setQrPos(cfg.qrPos);
    if (typeof cfg.qrUrl === 'string') setQrUrl(cfg.qrUrl);
    if (typeof cfg.topText === 'string') setTopText(cfg.topText);
    if (typeof cfg.showSeal === 'boolean') setShowSeal(cfg.showSeal);
    if (typeof cfg.showDates === 'boolean') setShowDates(cfg.showDates);
    if (cfg.dateFormat) setDateFormat(cfg.dateFormat);
    if (typeof cfg.backTextTop === 'string') setBackTextTop(cfg.backTextTop);
    if (typeof cfg.backTextMid === 'string') setBackTextMid(cfg.backTextMid);
    if (typeof cfg.backTextBot === 'string') setBackTextBot(cfg.backTextBot);
    if (cfg.backLang) setBackLang(cfg.backLang);
  };

  const logAudit = (action: string, field: string) => {
    const log = JSON.parse(localStorage.getItem('reth-credential-audit') || '[]');
    log.unshift({ by: 'admin', at: new Date().toISOString(), action, field, cfg: template });
    localStorage.setItem('reth-credential-audit', JSON.stringify(log.slice(0, 40)));
  };

  const toggleWithAudit = (setter: (v: boolean) => void, field: string) => (v: boolean) => {
    setter(v);
    logAudit(v ? 'enable' : 'disable', field);
  };

  const [savedPresets, setSavedPresets] = useState<{ name: string; cfg: ReturnType<typeof getElementCfg> }[]>([]);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('reth-element-presets');
      if (raw) setSavedPresets(JSON.parse(raw));
    } catch {}
  }, []);

  const saveElementPreset = () => {
    const name = presetName.trim();
    if (!name) return;
    const next = [...savedPresets.filter((p) => p.name !== name), { name, cfg: getElementCfg() }];
    setSavedPresets(next);
    localStorage.setItem('reth-element-presets', JSON.stringify(next));
    setPresetName('');
    logAudit('save-preset', name);
  };

  const loadElementPreset = (name: string) => {
    const builtin = BUILTIN_PRESETS.find((p) => p.name === name);
    if (builtin) { applyElementCfg(builtin.cfg); logAudit('load-preset', name); return; }
    const custom = savedPresets.find((p) => p.name === name);
    if (custom) { applyElementCfg(custom.cfg); logAudit('load-preset', name); }
  };

  const handleApplyPreset = (p: TypoPreset) => {
    setFont(p.font);
    setBoldName(p.boldName);
    setNameWeight(p.nameWeight);
    setItalicRole(p.italicRole);
    setNameSize(p.nameSize);
    setRoleSize(p.roleSize);
    setNameColor(p.nameColor);
    setRoleColor(p.roleColor);
    setTextAlign(p.textAlign);
    setAutoFitText(p.autoFitText);
    setShowDivider(p.showDivider);
    setNameCase(p.nameCase);
  };

  const handleSave = async () => {
    const cfg = buildCfg();
    localStorage.setItem('reth-credential-config', JSON.stringify(cfg));
    // guarda también en img/assets/credentials como recurso local (diseño nominado)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/portal-redthread/credenciales/save-design`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(cfg),
      });
      await fetchDesignList();
    } catch { }
    const log = JSON.parse(localStorage.getItem('reth-credential-audit') || '[]');
    log.unshift({ by: 'admin', at: new Date().toISOString(), cfg: designName || template });
    localStorage.setItem('reth-credential-audit', JSON.stringify(log.slice(0, 20)));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const buildCfg = () => ({
    designName, template, primary, secondary, accent, decorLines, decorThickness, decorPos,
    cardBgMode, watermarkUrl, watermarkOpacity, marginX, contentGap, digitalDark,
    font, boldName, nameWeight, italicRole, nameSize, roleSize, nameColor, roleColor, nameCase, textAlign, autoFitText, showDivider, langRole,
    logoPos, taglineTitle, taglineSubtitle, taglineTitleSize, taglineSubtitleSize, logoUrl, logoSize,
    showDOB, showPhone, showEmail, showID, showName, showSerial, serialWhere,
    showQR, qrSize, qrPos, qrUrl, topText, showSeal, showDates, dateFormat,
    backTextTop, backTextMid, backTextBot, backLang,
    photoShape, photoBorderWidth, photoBorderColor, photoBg, photoShadow,
    previewVersion, updatedAt: new Date().toISOString(),
  });

  const applyCfg = (c: Record<string, unknown>) => {
        if (c.tagline && !c.taglineTitle) {
          const parts = String(c.tagline).split('•');
          setTaglineTitle(parts[0]?.trim() || 'RETH');
          setTaglineSubtitle(parts[1]?.trim() || 'Internal Access System');
        }
        if (typeof c.designName === 'string') setDesignName(c.designName);
        if (c.taglineTitle) setTaglineTitle(c.taglineTitle as string);
        if (c.taglineSubtitle) setTaglineSubtitle(c.taglineSubtitle as string);
        if (typeof c.taglineTitleSize === 'number') setTaglineTitleSize(c.taglineTitleSize);
        if (typeof c.taglineSubtitleSize === 'number') setTaglineSubtitleSize(c.taglineSubtitleSize);
        if (typeof c.logoSize === 'number') setLogoSize(c.logoSize);
        if (c.logoUrl) setLogoUrl(c.logoUrl as string);
        if (c.logoPos) setLogoPos(c.logoPos as typeof logoPos);
        if (c.photoShape) setPhotoShape(c.photoShape as typeof photoShape);
        if (typeof c.photoBorderWidth === 'number') setPhotoBorderWidth(c.photoBorderWidth);
        if (c.photoBorderColor) setPhotoBorderColor(c.photoBorderColor as string);
        if (c.photoBg) setPhotoBg(c.photoBg as typeof photoBg);
        if (typeof c.photoShadow === 'boolean') setPhotoShadow(c.photoShadow);

        if (c.template) setTemplate(c.template as string);
        if (c.primary) setPrimary(c.primary as string);
        if (c.secondary) setSecondary(c.secondary as string);
        if (c.accent) setAccent(c.accent as string);
        if (typeof c.decorLines === 'boolean') setDecorLines(c.decorLines);
        if (typeof c.decorThickness === 'number') setDecorThickness(c.decorThickness);
        if (c.decorPos) setDecorPos(c.decorPos as typeof decorPos);
        if (c.cardBgMode) setCardBgMode(c.cardBgMode as typeof cardBgMode);
        if (c.watermarkUrl) setWatermarkUrl(c.watermarkUrl as string);
        if (typeof c.watermarkOpacity === 'number') setWatermarkOpacity(c.watermarkOpacity);
        if (typeof c.marginX === 'number') setMarginX(c.marginX);
        if (typeof c.contentGap === 'number') setContentGap(c.contentGap);
        if (typeof c.digitalDark === 'boolean') setDigitalDark(c.digitalDark);

        if (typeof c.font === 'string') setFont(c.font);
        if (typeof c.boldName === 'boolean') setBoldName(c.boldName);
        if (typeof c.nameWeight === 'number') setNameWeight(c.nameWeight);
        if (typeof c.italicRole === 'boolean') setItalicRole(c.italicRole);
        if (typeof c.nameSize === 'number') setNameSize(c.nameSize);
        if (typeof c.roleSize === 'number') setRoleSize(c.roleSize);
        if (c.nameColor) setNameColor(c.nameColor as string);
        if (c.roleColor) setRoleColor(c.roleColor as string);
        if (c.nameCase) setNameCase(c.nameCase as typeof nameCase);
        if (c.textAlign) setTextAlign(c.textAlign as typeof textAlign);
        if (typeof c.autoFitText === 'boolean') setAutoFitText(c.autoFitText);
        if (typeof c.showDivider === 'boolean') setShowDivider(c.showDivider);
        if (c.langRole) setLangRole(c.langRole as 'en' | 'es');

        if (typeof c.showDOB === 'boolean') setShowDOB(c.showDOB);
        if (typeof c.showPhone === 'boolean') setShowPhone(c.showPhone);
        if (typeof c.showEmail === 'boolean') setShowEmail(c.showEmail);
        if (typeof c.showID === 'boolean') setShowID(c.showID);
        if (typeof c.showName === 'boolean') setShowName(c.showName);
        if (typeof c.showSerial === 'boolean') setShowSerial(c.showSerial);
        if (c.serialWhere) setSerialWhere(c.serialWhere as typeof serialWhere);
        if (typeof c.showQR === 'boolean') setShowQR(c.showQR);
        if (typeof c.qrSize === 'number') setQrSize(c.qrSize);
        if (c.qrPos) setQrPos(c.qrPos as typeof qrPos);
        if (typeof c.qrUrl === 'string') setQrUrl(c.qrUrl);
        if (typeof c.topText === 'string') setTopText(c.topText);
        if (typeof c.showSeal === 'boolean') setShowSeal(c.showSeal);
        if (typeof c.showDates === 'boolean') setShowDates(c.showDates);
        if (c.dateFormat) setDateFormat(c.dateFormat as typeof dateFormat);
        if (typeof c.backTextTop === 'string') setBackTextTop(c.backTextTop);
        if (typeof c.backTextMid === 'string') setBackTextMid(c.backTextMid);
        if (typeof c.backTextBot === 'string') setBackTextBot(c.backTextBot);
        if (c.backLang) setBackLang(c.backLang as 'en' | 'es');
        if (typeof c.previewVersion === 'string') setPreviewVersion(c.previewVersion);
        logAudit('load', (c.designName as string) || (c.previewVersion as string) || 'config');
  };

  const fetchDesignList = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/portal-redthread/credenciales/list`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSavedDesigns((data || []).filter((f: { name: string }) => f.name.startsWith('credential_design_') && f.name.endsWith('.json')));
      }
    } catch { }
    setLoadingList(false);
  };

  const loadDesignFromUrl = async (url: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`, { credentials: 'include' });
      if (res.ok) {
        const cfg = await res.json();
        applyCfg(cfg);
        localStorage.setItem('reth-credential-config', JSON.stringify(cfg));
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    } catch { }
  };

  // Carga inicial para migración y restauración de diseño completo
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('reth-credential-config') : null;
      if (raw) applyCfg(JSON.parse(raw));
    } catch { }
    fetchDesignList();
  }, []);
  const handleExport = () => {
    const cfg = JSON.stringify(buildCfg(), null, 2);
    const blob = new Blob([cfg], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (designName || previewVersion).replace(/[^a-zA-Z0-9-_]+/g, '-').toLowerCase();
    a.download = `reth-credential-${safeName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(f.type)) { alert('Usa PNG/JPG/WebP/SVG'); return; }
    if (f.size > 2 * 1024 * 1024) { alert('Máx 2MB'); return; }
    // preview local inmediato
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result as string);
    reader.readAsDataURL(f);
    // guarda en img/assets/credentials como recurso local
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/portal-redthread/credenciales/upload-logo`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setLogoUrl(data.url);
      }
    } catch { }
    e.target.value = '';
  };

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(f.type)) { alert('Usa PNG/JPG/WebP/SVG'); return; }
    if (f.size > 2 * 1024 * 1024) { alert('Máx 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => { setWatermarkUrl(reader.result as string); logAudit('upload', 'watermark'); };
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  return (
    <AdminLayout>
      <Head><title>EmployeeIdDesign | Admin Portal ReTh</title></Head>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box mb={3}>
          <Typography variant="h4" fontWeight={800}>Credenciales</Typography>
          <Typography variant="body2" color="text.secondary">Administra el diseño de las credenciales sin tocar código. Vista previa en tiempo real. Ruta: /portal-redthread/empleados/EmployeeIdDesign</Typography>
        </Box>

        {saved && <Alert severity="success" sx={{ mb: 2 }}>Configuración guardada. Auditado.</Alert>}

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
                <Tab label="Diseño visual" />
                <Tab label="Logo" />
                <Tab label="Photo" />
                <Tab label="Tipografía" />
                <Tab label="Elementos" />
                <Tab label="Versiones / Diseños" />
              </Tabs>
            </Paper>

            {tab === 0 && (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PaletteIcon fontSize="small" sx={{ color: '#E63946' }} /> Diseño visual — apariencia general
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                  Plantillas, paleta con validación de contraste, patrones, fondo y distribución. El estilo actual (geométrico) es la plantilla base.
                </Typography>

                <Typography variant="caption" fontWeight={700} display="block" mb={1} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plantillas</Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mb={1.5}>
                  {TEMPLATES.map((t) => (
                    <Chip
                      key={t.id}
                      label={t.label}
                      size="small"
                      clickable
                      variant={template === t.id ? 'filled' : 'outlined'}
                      color={template === t.id ? 'error' : 'default'}
                      onClick={() => { setTemplate(t.id); logAudit('set', 'template'); }}
                      sx={{ fontWeight: template === t.id ? 700 : 400 }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  {TEMPLATES.find((t) => t.id === template)?.desc || 'Plantilla personalizada'}
                </Typography>

                <Divider sx={{ mb: 1.5 }} />
                <Typography variant="caption" fontWeight={700} display="block" mb={1} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Paleta de colores</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}><TextField fullWidth label="Primario" type="color" value={primary} onChange={(e) => { setPrimary(e.target.value); logAudit('set', 'primary'); }} /></Grid>
                  <Grid item xs={4}><TextField fullWidth label="Secundario" type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} /></Grid>
                  <Grid item xs={4}><TextField fullWidth label="Acentos" type="color" value={accent} onChange={(e) => setAccent(e.target.value)} /></Grid>
                </Grid>
                <Alert severity={contrastOk ? 'success' : 'warning'} sx={{ mt: 1.5, fontSize: '0.75rem' }}>
                  {contrastOk
                    ? `Contraste OK — texto blanco sobre primario ${whiteOnPrimary.toFixed(1)}:1 · secundario ${whiteOnSecondary.toFixed(1)}:1`
                    : `Bajo contraste — primario ${whiteOnPrimary.toFixed(1)}:1 · secundario ${whiteOnSecondary.toFixed(1)}:1 (mín. recomendado 4.5:1)`}
                </Alert>

                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" fontWeight={700} display="block" mb={0.5} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Líneas y patrones decorativos</Typography>
                <FormControlLabel control={<Switch checked={decorLines} onChange={(e) => { setDecorLines(e.target.checked); logAudit(e.target.checked ? 'enable' : 'disable', 'decorLines'); }} />} label="Líneas decorativas" />
                {decorLines && (
                  <>
                    <Typography variant="caption" fontWeight={700} display="block" mt={1}>Grosor: {decorThickness}px</Typography>
                    <Slider value={decorThickness} min={1} max={6} step={1} onChange={(_, v) => setDecorThickness(v as number)} valueLabelDisplay="auto" sx={{ color: '#E63946' }} />
                    <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                      <InputLabel>Posición</InputLabel>
                      <Select value={decorPos} label="Posición" onChange={(e) => { setDecorPos(e.target.value as typeof decorPos); logAudit('set', 'decorPos'); }}>
                        <MenuItem value="header">Header (línea superior)</MenuItem>
                        <MenuItem value="franja">Franja inferior</MenuItem>
                        <MenuItem value="diagonal">Diagonal / patrón</MenuItem>
                        <MenuItem value="marco">Marco perimetral</MenuItem>
                      </Select>
                    </FormControl>
                  </>
                )}

                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" fontWeight={700} display="block" mb={0.5} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fondo de la credencial</Typography>
                <ToggleButtonGroup value={cardBgMode} exclusive size="small" onChange={(_, v) => v && setCardBgMode(v)} sx={{ mb: 1.5 }}>
                  <ToggleButton value="solid" sx={{ fontSize: '0.72rem', px: 1.5 }}>Sólido</ToggleButton>
                  <ToggleButton value="gradient" sx={{ fontSize: '0.72rem', px: 1.5 }}>Degradado</ToggleButton>
                  <ToggleButton value="pattern" sx={{ fontSize: '0.72rem', px: 1.5 }}>Patrón</ToggleButton>
                </ToggleButtonGroup>
                <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 1.5, mb: 1, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Button size="small" component="label" variant="outlined" startIcon={<ImageIcon />}>
                    Watermark
                    <input type="file" hidden accept="image/*" onChange={handleWatermarkUpload} />
                  </Button>
                  {watermarkUrl && <Button size="small" onClick={() => setWatermarkUrl(null)}>Quitar</Button>}
                  {watermarkUrl && (
                    <Box sx={{ flex: 1, minWidth: 140 }}>
                      <Typography variant="caption" fontWeight={700}>Opacidad: {Math.round(watermarkOpacity * 100)}%</Typography>
                      <Slider value={watermarkOpacity} min={0} max={0.2} step={0.01} onChange={(_, v) => setWatermarkOpacity(v as number)} size="small" />
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" fontWeight={700} display="block" mb={0.5} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Distribución general</Typography>
                <Typography variant="caption" fontWeight={700}>Márgenes laterales: {marginX.toFixed(1)}px</Typography>
                <Slider value={marginX} min={4} max={16} step={0.5} onChange={(_, v) => setMarginX(v as number)} valueLabelDisplay="auto" sx={{ color: '#E63946', mb: 1 }} />
                <Typography variant="caption" fontWeight={700}>Espaciado entre secciones: {contentGap.toFixed(2)}</Typography>
                <Slider value={contentGap} min={0} max={2} step={0.1} onChange={(_, v) => setContentGap(v as number)} valueLabelDisplay="auto" sx={{ color: '#E63946' }} />

                <Divider sx={{ my: 1.5 }} />
                <Box display="flex" gap={2} flexWrap="wrap">
                  <FormControlLabel control={<Switch checked={digitalDark} onChange={(e) => { setDigitalDark(e.target.checked); logAudit(e.target.checked ? 'enable' : 'disable', 'digitalDark'); }} />} label="Modo digital dark (solo preview/export)" />
                </Box>
                <Typography variant="caption" color="text.secondary" display="block">La alineación global se controla en Tipografía (izquierda / centro / derecha). Transiciones de color aplican 0.2s en la tarjeta.</Typography>

                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" fontWeight={700} display="block" mb={1} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Presets de diseño visual</Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                  {visualPresets.map((p) => (
                    <Chip key={p.name} label={p.name} size="small" clickable color="primary" variant="outlined" onClick={() => loadVisualPreset(p.name)} onDelete={() => {
                      const next = visualPresets.filter((x) => x.name !== p.name);
                      setVisualPresets(next);
                      localStorage.setItem('reth-visual-presets', JSON.stringify(next));
                    }} />
                  ))}
                  {visualPresets.length === 0 && <Typography variant="caption" color="text.secondary">Sin presets personalizados aún.</Typography>}
                </Box>
                <Box display="flex" gap={1}>
                  <TextField size="small" label="Nombre del preset (ej. Staff, Design, VIP)" value={visualPresetName} onChange={(e) => setVisualPresetName(e.target.value)} sx={{ flex: 1 }} />
                  <Button size="small" variant="outlined" onClick={saveVisualPreset} disabled={!visualPresetName.trim()}>Guardar</Button>
                </Box>
              </Paper>
            )}

            {tab === 1 && (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Logo</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>Carga el logo de la empresa para frente y reverso. Se aplica a ambas caras de la tarjeta.</Typography>
                <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 2, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.02)', maxWidth: 320 }}>
                  <Box sx={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'white', borderRadius: 1, border: '1px solid #eee', mb: 1.5, overflow: 'hidden' }}>
                    {logoUrl ? <Box component="img" src={logoUrl} alt="logo" sx={{ maxHeight: `${Math.min(logoSize * 6, 56)}px`, maxWidth: '100%', objectFit: 'contain' }} /> : <Typography variant="caption" color="text.secondary">Sin logo</Typography>}
                  </Box>
                  <Button size="small" component="label" variant="outlined" startIcon={<ImageIcon />} sx={{ borderRadius: 2 }}>
                    Cargar logo
                    <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                  </Button>
                  {logoUrl && <Button size="small" sx={{ ml: 1 }} onClick={() => setLogoUrl(null)}>Quitar</Button>}
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>PNG/JPG/WebP/SVG · máx 2MB · se aplica a frente y reverso</Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" fontWeight={700}>Tamaño del logo: {logoSize}mm</Typography>
                  <Slider value={logoSize} min={3} max={18} step={0.5} onChange={(_, v) => setLogoSize(v as number)} valueLabelDisplay="auto" />
                  <Typography variant="caption" color="text.secondary">Ajusta para que no se vea pequeño. Se refleja en la vista previa y en la tarjeta impresa.</Typography>
                </Box>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6}><TextField fullWidth label="Título (fila 1)" value={taglineTitle} onChange={(e) => setTaglineTitle(e.target.value)} placeholder="RETH" helperText="Ej. RETH" /></Grid>
                  <Grid item xs={6}><TextField fullWidth label="Subtítulo (fila 2)" value={taglineSubtitle} onChange={(e) => setTaglineSubtitle(e.target.value)} placeholder="Internal Access System" helperText="Ej. Internal Access System" /></Grid>
                </Grid>
                <Box sx={{ mt: 2, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <Typography variant="caption" fontWeight={700}>Tamaño título: {taglineTitleSize}mm</Typography>
                  <Slider value={taglineTitleSize} min={1.2} max={5.0} step={0.1} onChange={(_, v) => setTaglineTitleSize(v as number)} valueLabelDisplay="auto" />
                </Box>
                <Box sx={{ mt: 1, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <Typography variant="caption" fontWeight={700}>Tamaño subtítulo: {taglineSubtitleSize}mm</Typography>
                  <Slider value={taglineSubtitleSize} min={0.8} max={3.0} step={0.1} onChange={(_, v) => setTaglineSubtitleSize(v as number)} valueLabelDisplay="auto" />
                </Box>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Posición del logo</InputLabel>
                  <Select value={logoPos === 'esquina' ? 'superior-derecha' : (logoPos || 'superior')} label="Posición del logo" onChange={(e) => setLogoPos(e.target.value)}>
                    <MenuItem value="superior">Superior (arriba izquierda)</MenuItem>
                    <MenuItem value="superior-derecha">Superior (arriba derecha)</MenuItem>
                    <MenuItem value="inferior">Inferior (abajo izquierda)</MenuItem>
                    <MenuItem value="inferior-derecha">Inferior (abajo derecha)</MenuItem>
                  </Select>
                </FormControl>
                {logoPos !== 'superior' && <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem' }}>La posición seleccionada ({logoPos === 'superior-derecha' || logoPos === 'esquina' ? 'Superior derecha' : logoPos === 'inferior-derecha' ? 'Inferior derecha' : 'Inferior izquierda'}) se aplica en tiempo real en frente y reverso.</Alert>}
              </Paper>
            )}

            {tab === 2 && (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PhotoIcon fontSize="small" /> Photo — marco de la foto de perfil</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>Controla forma, borde, fondo y sombra del marco. La foto oficial se sube en cada empleado; aquí solo se define el estilo del template.</Typography>

                <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 2, mb: 2, maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    className="reth-cred"
                    sx={{
                      width: 96,
                      height: 96,
                      ...(photoShape === 'square' ? { borderRadius: '4px' } : photoShape === 'diamond' ? { borderRadius: 0, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' } : { borderRadius: '50%' }),
                      border: photoBorderWidth > 0 ? `${photoBorderWidth}px solid ${photoBorderColor}` : 'none',
                      boxShadow: photoShadow ? '0 2px 10px rgba(0,0,0,0.18)' : 'none',
                      bgcolor: photoBg === 'gray' ? '#f3f4f6' : photoBg === 'transparent' ? 'transparent' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SvgIcon viewBox="0 0 24 24" sx={{ width: 48, height: 48, color: '#9ca3af' }}>
                      <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </SvgIcon>
                  </Box>
                  <Chip size="small" label={photoShape === 'circle' ? 'Circle' : photoShape === 'square' ? 'Square' : 'Diamond'} />
                </Box>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Tipo de marco</InputLabel>
                  <Select value={photoShape} label="Tipo de marco" onChange={(e) => setPhotoShape(e.target.value as 'circle' | 'square' | 'diamond')}>
                    <MenuItem value="circle">Circle (circular)</MenuItem>
                    <MenuItem value="square">Square (cuadrado)</MenuItem>
                    <MenuItem value="diamond">Diamond (rombo)</MenuItem>
                  </Select>
                </FormControl>

                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={6}>
                    <Typography variant="caption" fontWeight={700}>Grosor borde: {photoBorderWidth}px</Typography>
                    <Slider value={photoBorderWidth} min={0} max={4} step={1} onChange={(_, v) => setPhotoBorderWidth(v as number)} valueLabelDisplay="auto" />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Color borde" type="color" value={photoBorderColor} onChange={(e) => setPhotoBorderColor(e.target.value)} helperText="Gris / negro / rojo" />
                  </Grid>
                </Grid>

                <FormControl fullWidth sx={{ mt: 1, mb: 1 }}>
                  <InputLabel>Fondo detrás de la foto</InputLabel>
                  <Select value={photoBg} label="Fondo detrás de la foto" onChange={(e) => setPhotoBg(e.target.value as 'white' | 'gray' | 'transparent')}>
                    <MenuItem value="white">Blanco</MenuItem>
                    <MenuItem value="gray">Gris claro</MenuItem>
                    <MenuItem value="transparent">Transparente</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel control={<Switch checked={photoShadow} onChange={(e) => setPhotoShadow(e.target.checked)} />} label="Sombra ligera (profundidad)" />

                <Divider sx={{ my: 2 }} />
                {!hasPreviewPhoto && (
                  <Alert severity="warning" icon={<WarnIcon />} sx={{ mt: 1, fontSize: '0.8rem' }}>
                    Sin foto oficial en la vista previa: Imprimir / Descargar PDF quedan deshabilitados hasta subir foto al empleado.
                  </Alert>
                )}
              </Paper>
            )}

            {tab === 3 && (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextIcon fontSize="small" sx={{ color: '#E63946' }} /> Estudio de Tipografía
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Control total sobre fuente, tamaño, color y estilo del nombre y puesto. Vista previa en tiempo real con clamp() automático anti-desbordamiento.
                </Typography>

                {/* Presets rápidos */}
                <Typography variant="caption" fontWeight={700} display="block" mb={1} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <StyleIcon sx={{ fontSize: 13, mr: 0.5, verticalAlign: 'middle' }} />Estilos Rápidos
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mb={2.5}>
                  {TYPO_PRESETS.map((p) => (
                    <Tooltip key={p.name} title={`${p.font} · ${p.nameColor}`} arrow>
                      <Chip
                        label={p.name}
                        size="small"
                        clickable
                        onClick={() => handleApplyPreset(p)}
                        sx={{
                          fontFamily: p.font,
                          fontWeight: p.boldName ? 700 : 400,
                          border: font === p.font && nameColor === p.nameColor ? '1.5px solid #E63946' : '1px solid #e5e7eb',
                          bgcolor: font === p.font && nameColor === p.nameColor ? 'rgba(230,57,70,0.08)' : 'transparent',
                          transition: 'all 0.15s',
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>

                <Divider sx={{ mb: 2.5 }} />

                {/* Selector de fuente */}
                <Typography variant="caption" fontWeight={700} display="block" mb={1} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Fuente
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mb={2.5}>
                  {FONTS.map((f) => (
                    <Chip
                      key={f}
                      label={f}
                      size="small"
                      clickable
                      onClick={() => setFont(f)}
                      sx={{
                        fontFamily: f,
                        fontWeight: font === f ? 700 : 400,
                        border: font === f ? '1.5px solid #E63946' : '1px solid #e5e7eb',
                        bgcolor: font === f ? 'rgba(230,57,70,0.08)' : 'transparent',
                      }}
                    />
                  ))}
                </Box>

                {/* Tamaños */}
                <Typography variant="caption" fontWeight={700} display="block" mb={0.5} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Tamaño Nombre: {nameSize.toFixed(1)}mm
                </Typography>
                <Slider value={nameSize} min={2.0} max={4.5} step={0.1} onChange={(_, v) => setNameSize(v as number)} valueLabelDisplay="auto" valueLabelFormat={(v) => `${v}mm`} sx={{ color: '#E63946', mb: 1.5 }} />

                <Typography variant="caption" fontWeight={700} display="block" mb={0.5} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Tamaño Puesto/Rol: {roleSize.toFixed(1)}mm
                </Typography>
                <Slider value={roleSize} min={1.2} max={2.8} step={0.1} onChange={(_, v) => setRoleSize(v as number)} valueLabelDisplay="auto" valueLabelFormat={(v) => `${v}mm`} sx={{ color: '#E63946', mb: 2 }} />

                <Divider sx={{ mb: 2 }} />

                {/* Paleta colores corporativos — Nombre */}
                <Typography variant="caption" fontWeight={700} display="block" mb={1} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Color del Nombre
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" alignItems="center" mb={1}>
                  {CORPORATE_COLORS.map((c) => (
                    <Tooltip key={c.value} title={c.label} arrow>
                      <Box
                        onClick={() => setNameColor(c.value)}
                        sx={{
                          width: 24, height: 24, borderRadius: '50%', bgcolor: c.value, cursor: 'pointer',
                          border: nameColor === c.value ? '2.5px solid #E63946' : '2px solid rgba(0,0,0,0.12)',
                          boxShadow: nameColor === c.value ? '0 0 0 2px rgba(230,57,70,0.35)' : 'none',
                          transition: 'all 0.15s',
                          '&:hover': { transform: 'scale(1.18)' },
                        }}
                      />
                    </Tooltip>
                  ))}
                  <TextField
                    type="color"
                    size="small"
                    value={nameColor}
                    onChange={(e) => setNameColor(e.target.value)}
                    sx={{ width: 48, '& input': { p: 0.5, cursor: 'pointer' } }}
                    title="Color personalizado"
                  />
                </Box>

                {/* Paleta colores corporativos — Rol */}
                <Typography variant="caption" fontWeight={700} display="block" mt={1.5} mb={1} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Color del Rol / Puesto
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" alignItems="center" mb={2}>
                  {CORPORATE_COLORS.map((c) => (
                    <Tooltip key={c.value} title={c.label} arrow>
                      <Box
                        onClick={() => setRoleColor(c.value)}
                        sx={{
                          width: 24, height: 24, borderRadius: '50%', bgcolor: c.value, cursor: 'pointer',
                          border: roleColor === c.value ? '2.5px solid #E63946' : '2px solid rgba(0,0,0,0.12)',
                          boxShadow: roleColor === c.value ? '0 0 0 2px rgba(230,57,70,0.35)' : 'none',
                          transition: 'all 0.15s',
                          '&:hover': { transform: 'scale(1.18)' },
                        }}
                      />
                    </Tooltip>
                  ))}
                  <TextField
                    type="color"
                    size="small"
                    value={roleColor}
                    onChange={(e) => setRoleColor(e.target.value)}
                    sx={{ width: 48, '& input': { p: 0.5, cursor: 'pointer' } }}
                    title="Color personalizado"
                  />
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Estilo y alineación */}
                <Grid container spacing={2} alignItems="flex-start" mb={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" fontWeight={700} display="block" mb={1} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Estilo
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Tooltip title="Nombre en negrita">
                        <ToggleButton value="bold" selected={boldName} size="small" onChange={() => setBoldName(!boldName)} sx={{ px: 1.5 }}>
                          <BoldIcon fontSize="small" />
                        </ToggleButton>
                      </Tooltip>
                      <Tooltip title="Rol en cursiva">
                        <ToggleButton value="italic" selected={italicRole} size="small" onChange={() => setItalicRole(!italicRole)} sx={{ px: 1.5 }}>
                          <ItalicIcon fontSize="small" />
                        </ToggleButton>
                      </Tooltip>
                      <Tooltip title="Auto-ajuste de tamaño (clamp)">
                        <ToggleButton value="autofit" selected={autoFitText} size="small" onChange={() => setAutoFitText(!autoFitText)} sx={{ px: 1.5 }}>
                          <AutoFixIcon fontSize="small" />
                        </ToggleButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" fontWeight={700} display="block" mb={1} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Alineación
                    </Typography>
                    <ToggleButtonGroup value={textAlign} exclusive size="small" onChange={(_, v) => v && setTextAlign(v)}>
                      <ToggleButton value="left"><AlignLeftIcon fontSize="small" /></ToggleButton>
                      <ToggleButton value="center"><AlignCenterIcon fontSize="small" /></ToggleButton>
                      <ToggleButton value="right"><AlignRightIcon fontSize="small" /></ToggleButton>
                    </ToggleButtonGroup>
                  </Grid>
                </Grid>

                <Grid container spacing={2} mb={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" fontWeight={700} display="block" mb={1} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Capitalización
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select value={nameCase} onChange={(e) => setNameCase(e.target.value as 'uppercase' | 'capitalize' | 'none')}>
                        <MenuItem value="uppercase">MAYÚSCULAS (uppercase)</MenuItem>
                        <MenuItem value="capitalize">Capitalized (Primera Letra)</MenuItem>
                        <MenuItem value="none">Sin transformar</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" fontWeight={700} display="block" mb={1} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Idioma del Rol
                    </Typography>
                    <ToggleButtonGroup value={langRole} exclusive size="small" onChange={(_, v) => v && setLangRole(v)}>
                      <ToggleButton value="en" sx={{ fontSize: '0.72rem', px: 1.5 }}>EN</ToggleButton>
                      <ToggleButton value="es" sx={{ fontSize: '0.72rem', px: 1.5 }}>ES</ToggleButton>
                    </ToggleButtonGroup>
                  </Grid>
                </Grid>

                <Box display="flex" gap={2} mb={2.5}>
                  <FormControlLabel control={<Switch checked={showDivider} size="small" onChange={(e) => setShowDivider(e.target.checked)} />} label="Mostrar separador" />
                  {boldName && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" fontWeight={700} sx={{ color: '#6B7280' }}>Peso: {nameWeight}</Typography>
                      <Slider value={nameWeight} min={400} max={900} step={100} onChange={(_, v) => setNameWeight(v as number)} sx={{ width: 80, color: '#E63946' }} size="small" />
                    </Box>
                  )}
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Test de nombres para comprobar anti-desborde */}
                <Typography variant="caption" fontWeight={700} display="block" mb={1} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <SpellcheckIcon sx={{ fontSize: 13, mr: 0.5, verticalAlign: 'middle' }} /> Prueba Anti-Desborde
                </Typography>
                <Box display="flex" gap={1} mb={2.5} flexWrap="wrap">
                  {TEST_NAMES.map((t) => (
                    <Chip
                      key={t.id}
                      label={t.label}
                      size="small"
                      clickable
                      variant={testNameMode === t.id ? 'filled' : 'outlined'}
                      color={testNameMode === t.id ? 'error' : 'default'}
                      onClick={() => setTestNameMode(t.id as 'standard' | 'short' | 'long')}
                    />
                  ))}
                </Box>

                {/* Mini-previsualización tipográfica local */}
                <Box
                  sx={{
                    border: '1px dashed #e5e7eb',
                    borderRadius: 2,
                    p: 2.5,
                    bgcolor: 'rgba(0,0,0,0.015)',
                    textAlign,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
                    gap: 0.75,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Previsualización tipográfica instantánea
                  </Typography>
                  {(() => {
                    const t = TEST_NAMES.find((n) => n.id === testNameMode) ?? TEST_NAMES[0];
                    const rawName = `${t.first} ${t.last}`;
                    const nameLen = rawName.length;
                    const scale = autoFitText ? (nameLen > 28 ? 0.70 : nameLen > 22 ? 0.78 : nameLen > 16 ? 0.88 : 1) : 1;
                    const computedSize = (nameSize * scale).toFixed(2);
                    const displayNamePreview =
                      nameCase === 'capitalize'
                        ? rawName.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
                        : nameCase === 'none' ? rawName : rawName.toUpperCase();
                    const displayRole = langRole === 'es' ? t.roleEs : t.role;
                    return (
                      <>
                        <Typography sx={{
                          fontFamily: `${font}, sans-serif`,
                          fontWeight: boldName ? nameWeight : 500,
                          fontSize: `clamp(12px, ${computedSize}mm, 28px)`,
                          color: nameColor,
                          textAlign,
                          lineHeight: 1.1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          width: '100%',
                          maxWidth: 400,
                          transition: 'all 0.15s ease',
                        }}>
                          {displayNamePreview}
                        </Typography>
                        <Typography sx={{
                          fontFamily: `${font}, sans-serif`,
                          fontSize: `clamp(10px, ${roleSize}mm, 18px)`,
                          color: roleColor,
                          fontStyle: italicRole ? 'italic' : 'normal',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          textAlign,
                          width: '100%',
                          maxWidth: 400,
                        }}>
                          {displayRole}
                        </Typography>
                        {showDivider && (
                          <Box sx={{ width: 32, height: 2, bgcolor: nameColor, opacity: 0.6, borderRadius: 1, alignSelf: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center' }} />
                        )}
                        <Typography variant="caption" sx={{ color: '#9ca3af', mt: 0.5 }}>
                          {autoFitText ? `Auto-escala: ${computedSize}mm (${Math.round(scale * 100)}%)` : `Tamaño fijo: ${nameSize}mm`} · {font} · {nameCase}
                        </Typography>
                      </>
                    );
                  })()}
                </Box>
              </Paper>
            )}

            {tab === 4 && (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Elementos de la credencial</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>Cada switch activa/desactiva un campo en la vista previa al instante. Los cambios se auditán y guardan con “Guardar diseño”.</Typography>

                {requiredWarning && (
                  <Alert severity="warning" sx={{ mb: 1.5, fontSize: '0.8rem' }}>
                    Campo obligatorio desactivado {!showName && '(nombre)'} {!showID && '(ID)'} {!hasPreviewPhoto && '(foto)'} — la credencial no será válida para impresión.
                  </Alert>
                )}

                <Typography variant="caption" fontWeight={700} display="block" mb={0.5} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Campos del frente</Typography>
                <Box display="flex" flexDirection="column" gap={0.5}>
                  <FormControlLabel control={<Switch checked={showName} onChange={(e) => toggleWithAudit(setShowName, 'showName')(e.target.checked)} />} label="Nombre del empleado (obligatorio)" />
                  <FormControlLabel control={<Switch checked={showID} onChange={(e) => toggleWithAudit(setShowID, 'showID')(e.target.checked)} />} label="ID / código (obligatorio)" />
                  <FormControlLabel control={<Switch checked={showDOB} onChange={(e) => toggleWithAudit(setShowDOB, 'showDOB')(e.target.checked)} />} label="Mostrar DOB" />
                  <FormControlLabel control={<Switch checked={showPhone} onChange={(e) => toggleWithAudit(setShowPhone, 'showPhone')(e.target.checked)} />} label="Mostrar teléfono" />
                  <FormControlLabel control={<Switch checked={showEmail} onChange={(e) => toggleWithAudit(setShowEmail, 'showEmail')(e.target.checked)} />} label="Mostrar email" />
                  <FormControlLabel control={<Switch checked={showSeal} onChange={(e) => toggleWithAudit(setShowSeal, 'showSeal')(e.target.checked)} />} label="Sello / firma digital" />
                </Box>

                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" fontWeight={700} display="block" mb={0.5} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Número de serie</Typography>
                <FormControlLabel control={<Switch checked={showSerial} onChange={(e) => { toggleWithAudit(setShowSerial, 'showSerial')(e.target.checked); if (e.target.checked && serialWhere === 'none') setSerialWhere('back'); if (!e.target.checked) setSerialWhere('none'); }} />} label="Mostrar número de serie" />
                {showSerial && (
                  <FormControl fullWidth size="small" sx={{ mt: 1, mb: 1 }}>
                    <InputLabel>Ubicación del serie</InputLabel>
                    <Select value={serialWhere} label="Ubicación del serie" onChange={(e) => { setSerialWhere(e.target.value as typeof serialWhere); logAudit('set', 'serialWhere'); }}>
                      <MenuItem value="front">Solo frente</MenuItem>
                      <MenuItem value="back">Solo reverso</MenuItem>
                      <MenuItem value="both">Frente y reverso</MenuItem>
                    </Select>
                  </FormControl>
                )}

                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" fontWeight={700} display="block" mb={0.5} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>QR trasero</Typography>
                <FormControlLabel control={<Switch checked={showQR} onChange={(e) => toggleWithAudit(setShowQR, 'showQR')(e.target.checked)} />} label="Mostrar QR" />
                {showQR && (
                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Tamaño QR</InputLabel>
                        <Select value={String(qrSize)} label="Tamaño QR" onChange={(e) => { setQrSize(Number(e.target.value)); logAudit('set', 'qrSize'); }}>
                          <MenuItem value="15">15mm</MenuItem>
                          <MenuItem value="20">20mm</MenuItem>
                          <MenuItem value="25">25mm</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Posición QR</InputLabel>
                        <Select value={qrPos} label="Posición QR" onChange={(e) => { setQrPos(e.target.value as typeof qrPos); logAudit('set', 'qrPos'); }}>
                          <MenuItem value="centro">Centrado</MenuItem>
                          <MenuItem value="inferior-derecha">Inferior derecha</MenuItem>
                          <MenuItem value="inferior-izquierda">Inferior izquierda</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="URL base del QR" value={qrUrl} onChange={(e) => setQrUrl(e.target.value)} helperText="Endpoint que abrirá el código (se añade /{employeeCode})" />
                    </Grid>
                  </Grid>
                )}

                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" fontWeight={700} display="block" mb={0.5} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vigencia</Typography>
                <FormControlLabel control={<Switch checked={showDates} onChange={(e) => toggleWithAudit(setShowDates, 'showDates')(e.target.checked)} />} label="Mostrar fechas emisión / expiración" />
                {showDates && (
                  <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                    <InputLabel>Formato de fecha</InputLabel>
                    <Select value={dateFormat} label="Formato de fecha" onChange={(e) => { setDateFormat(e.target.value as typeof dateFormat); logAudit('set', 'dateFormat'); }}>
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    </Select>
                  </FormControl>
                )}
                {!showDates && (
                  <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem' }}>Fechas ocultas: la credencial no mostrará vigencia.</Alert>
                )}

                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" fontWeight={700} display="block" mb={0.5} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Textos del reverso</Typography>
                <ToggleButtonGroup value={backLang} exclusive size="small" onChange={(_, v) => v && setBackLang(v)} sx={{ mb: 1.5 }}>
                  <ToggleButton value="en" sx={{ fontSize: '0.72rem', px: 1.5 }}>EN</ToggleButton>
                  <ToggleButton value="es" sx={{ fontSize: '0.72rem', px: 1.5 }}>ES</ToggleButton>
                </ToggleButtonGroup>
                <TextField fullWidth size="small" label="Texto institucional (línea 1)" value={backTextTop} onChange={(e) => setBackTextTop(e.target.value)} placeholder={backLang === 'es' ? 'Propiedad de RETH Corporation' : 'Property of RETH Corporation'} sx={{ mb: 1 }} />
                <TextField fullWidth size="small" label="Aviso legal (línea 2)" value={backTextMid} onChange={(e) => setBackTextMid(e.target.value)} placeholder={backLang === 'es' ? 'La duplicación o uso no autorizado está prohibido' : 'Unauthorized duplication or use is prohibited'} sx={{ mb: 1 }} />
                <TextField fullWidth size="small" label="Devolución (línea 3)" value={backTextBot} onChange={(e) => setBackTextBot(e.target.value)} placeholder={backLang === 'es' ? 'Esta tarjeta debe devolverse al finalizar el empleo' : 'This card must be returned upon termination of employment'} />
                <Button size="small" sx={{ mt: 0.5 }} onClick={() => { setBackTextTop(''); setBackTextMid(''); setBackTextBot(''); }}>Restablecer textos al idioma</Button>

                <Divider sx={{ my: 1.5 }} />
                <TextField fullWidth label="Franja inferior (frente)" value={topText} onChange={(e) => setTopText(e.target.value)} helperText="Ej. Valid with official photo / VISITOR" size="small" />

                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" fontWeight={700} display="block" mb={1} sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plantillas de elementos (presets)</Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                  {BUILTIN_PRESETS.map((p) => (
                    <Chip key={p.name} label={p.name} size="small" clickable variant="outlined" onClick={() => loadElementPreset(p.name)} />
                  ))}
                  {savedPresets.map((p) => (
                    <Chip key={p.name} label={p.name} size="small" clickable color="primary" variant="outlined" onClick={() => loadElementPreset(p.name)} onDelete={() => {
                      const next = savedPresets.filter((x) => x.name !== p.name);
                      setSavedPresets(next);
                      localStorage.setItem('reth-element-presets', JSON.stringify(next));
                    }} />
                  ))}
                </Box>
                <Box display="flex" gap={1}>
                  <TextField size="small" label="Nombre del preset" value={presetName} onChange={(e) => setPresetName(e.target.value)} sx={{ flex: 1 }} />
                  <Button size="small" variant="outlined" onClick={saveElementPreset} disabled={!presetName.trim()}>Guardar</Button>
                </Box>
              </Paper>
            )}

            {tab === 5 && (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Diseños guardados, versiones y auditoría</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                  El borrador se guarda en este navegador. «Guardar diseño» crea/actualiza un archivo nominado en el servidor (por nombre de versión, sin duplicados).
                </Typography>
                <Box display="flex" gap={1} alignItems="flex-end" mb={1.5} flexWrap="wrap">
                  <TextField label="Nombre del diseño" value={designName} onChange={(e) => setDesignName(e.target.value)} size="small" sx={{ minWidth: 200 }} helperText="Ej. Staff, Visitor, VIP, Retención" />
                  <TextField label="Versión (archivo)" value={previewVersion} onChange={(e) => setPreviewVersion(e.target.value)} size="small" sx={{ width: 140 }} />
                  <Button variant="outlined" onClick={handleExport} startIcon={<ExportIcon />}>Exportar JSON</Button>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="caption" fontWeight={700}>Diseños en servidor (img/assets/credentials)</Typography>
                  <Button size="small" onClick={fetchDesignList} disabled={loadingList}>{loadingList ? 'Actualizando…' : 'Actualizar'}</Button>
                </Box>
                {savedDesigns.length === 0 && (
                  <Typography variant="caption" color="text.secondary">Sin diseños guardados aún. Pulsa «Guardar diseño».</Typography>
                )}
                {savedDesigns.map((f) => (
                  <Box key={f.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" sx={{ flex: 1, fontFamily: 'monospace', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</Typography>
                    <Chip size="small" label={`${Math.round(f.size / 1024)} KB`} sx={{ height: 20, fontSize: '0.65rem' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{f.modified.slice(0, 16).replace('T', ' ')}</Typography>
                    <Button size="small" variant="outlined" onClick={() => loadDesignFromUrl(f.url)}>Cargar</Button>
                  </Box>
                ))}
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">Multilenguaje: credenciales en inglés por defecto, con opción de traducir etiquetas. Auditoría registra quién y cuándo modificó el diseño (localStorage).</Typography>
                <Typography variant="caption" fontWeight={700} display="block" mt={1.5}>Historial (local)</Typography>
                <Box sx={{ maxHeight: 160, overflow: 'auto', mt: 1, p: 1, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.7rem' }}>
                  {(JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('reth-credential-audit') || '[]' : '[]') as any[]).map((h: any, i: number) => (
                    <Box key={i} sx={{ mb: 0.5 }}>{h.at} — {h.by} — {h.cfg}</Box>
                  ))}
                  {typeof window !== 'undefined' && !localStorage.getItem('reth-credential-audit') && <Box>Sin registros aún.</Box>}
                </Box>
              </Paper>
            )}

            <Box display="flex" gap={1} mt={2}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} sx={{ borderRadius: 2, bgcolor: '#E63946', '&:hover': { bgcolor: '#B71C1C' } }}>Guardar diseño</Button>
              <Button variant="outlined" onClick={handleExport} startIcon={<ExportIcon />}>Exportar para dev/prod</Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2, borderRadius: 2, position: 'sticky', top: 16 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><ViewIcon fontSize="small" /> Vista previa en tiempo real</Typography>
              <Alert severity={(!showEmail || !showDOB || !hasPreviewPhoto || requiredWarning) ? 'warning' : 'info'} sx={{ mb: 2, fontSize: '0.75rem' }} icon={<HistoryIcon fontSize="small" />}>
                {!hasPreviewPhoto || requiredWarning ? 'Campo obligatorio desactivado o sin foto: validar antes de imprimir' : (!showEmail || !showDOB) ? 'Faltan datos: la credencial mostrará advertencia' : 'Vista previa actualizada'}
              </Alert>
              {(() => {
                const tName = TEST_NAMES.find((n) => n.id === testNameMode) ?? TEST_NAMES[0];
                const previewKey = [
                  taglineTitleSize, taglineSubtitleSize, logoSize, logoPos, taglineTitle, taglineSubtitle,
                  photoShape, photoBorderWidth, photoBorderColor, photoBg, photoShadow,
                  font, boldName, nameWeight, italicRole, nameSize, roleSize, nameColor, roleColor,
                  nameCase, textAlign, autoFitText, showDivider, testNameMode, langRole,
                  showDOB, showPhone, showEmail, showID, showName, showSeal, topText,
                  showSerial, serialWhere, showQR, qrSize, qrPos, qrUrl,
                  showDates, dateFormat, backTextTop, backTextMid, backTextBot, backLang,
                  template, primary, secondary, accent, decorLines, decorThickness, decorPos,
                  cardBgMode, watermarkUrl, watermarkOpacity, marginX, contentGap, digitalDark,
                ].join('-');
                const previewRole = langRole === 'es' ? tName.roleEs : tName.role;
                return (
                  <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap', transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Chip label={`${font} · ${nameSize.toFixed(1)}mm · ${nameCase}`} size="small" sx={{ fontFamily: font, fontWeight: boldName ? 700 : 400 }} />
                      <CredentialCard
                        key={`front-${previewKey}`}
                        firstName={tName.first}
                        lastName={tName.last}
                        departmentName={tName.dept}
                        roleName={previewRole}
                        employeeCode="AA-00000"
                        email={showEmail ? 'maria.smith@reth.app' : undefined}
                        phone={showPhone ? '+52 123 456 789' : undefined}
                        birthDate={showDOB ? '2000-12-12' : undefined}
                        photoUrl={null}
                        logoUrl={logoUrl}
                        logoSize={logoSize}
                        taglineTitle={taglineTitle}
                        taglineSubtitle={taglineSubtitle}
                        logoPos={logoPos}
                        taglineTitleSize={taglineTitleSize}
                        taglineSubtitleSize={taglineSubtitleSize}
                        photoShape={photoShape}
                        photoBorderWidth={photoBorderWidth}
                        photoBorderColor={photoBorderColor}
                        photoBg={photoBg}
                        photoShadow={photoShadow}
                        fontFamily={font}
                        boldName={boldName}
                        nameWeight={nameWeight}
                        italicRole={italicRole}
                        nameSize={nameSize}
                        roleSize={roleSize}
                        nameColor={nameColor}
                        roleColor={roleColor}
                        nameCase={nameCase}
                        textAlign={textAlign}
                        autoFitText={autoFitText}
                        showDivider={showDivider}
                        showDOB={showDOB}
                        showPhone={showPhone}
                        showEmail={showEmail}
                        showID={showID}
                        showName={showName}
                        showSerial={showSerial && (serialWhere === 'front' || serialWhere === 'both')}
                        showSeal={showSeal}
                        topText={topText}
                        primary={primary}
                        secondary={secondary}
                        accent={accent}
                        template={template}
                        decorLines={decorLines}
                        decorThickness={decorThickness}
                        decorPos={decorPos}
                        cardBgMode={cardBgMode}
                        watermarkUrl={watermarkUrl}
                        watermarkOpacity={watermarkOpacity}
                        marginX={marginX}
                        contentGap={contentGap}
                        digitalDark={digitalDark}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Chip label="Reverso" size="small" variant="outlined" />
                      <CredentialBack
                        key={`back-${previewKey}`}
                        employeeCode="AA-00000"
                        email={showEmail ? 'maria.smith@reth.app' : undefined}
                        issueDate="2021-01-01"
                        expiryDate="2030-01-01"
                        serial="SN-AA-00000-MS"
                        logoUrl={logoUrl}
                        logoSize={logoSize}
                        taglineTitle={taglineTitle}
                        taglineSubtitle={taglineSubtitle}
                        logoPos={logoPos}
                        taglineTitleSize={taglineTitleSize}
                        taglineSubtitleSize={taglineSubtitleSize}
                        showQR={showQR}
                        qrSize={qrSize}
                        qrPos={qrPos}
                        qrUrl={qrUrl}
                        showDates={showDates}
                        dateFormat={dateFormat}
                        showSerial={showSerial && (serialWhere === 'back' || serialWhere === 'both')}
                        backTextTop={backTextTop}
                        backTextMid={backTextMid}
                        backTextBot={backTextBot}
                        backLang={backLang}
                        primary={primary}
                        secondary={secondary}
                        accent={accent}
                        digitalDark={digitalDark}
                      />
                    </Box>
                  </Box>
                );
              })()}
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button fullWidth variant="outlined" onClick={() => window.print()} disabled={!hasPreviewPhoto} sx={{ borderRadius: 2 }} startIcon={!hasPreviewPhoto ? <WarnIcon /> : undefined}>Imprimir</Button>
                <Button fullWidth variant="contained" onClick={() => window.print()} disabled={!hasPreviewPhoto} sx={{ borderRadius: 2, bgcolor: '#E63946', '&:hover': { bgcolor: '#B71C1C' } }} startIcon={!hasPreviewPhoto ? <WarnIcon /> : undefined}>Descargar PDF</Button>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" mt={1} textAlign="center">Validación: si falta foto/nombre/código se desactiva el botón con ícono de advertencia.</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </AdminLayout>
  );
}
