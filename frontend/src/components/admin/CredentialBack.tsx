import { Box, Typography } from '@mui/material';

interface Props {
  employeeCode: string;
  email?: string;
  issueDate: string;
  expiryDate: string;
  serial: string;
  logoUrl?: string | null;
  logoSize?: number;
  taglineTitle?: string;
  taglineSubtitle?: string;
  logoPos?: string;
  taglineTitleSize?: number;
  taglineSubtitleSize?: number;
  showQR?: boolean;
  qrSize?: number;
  qrPos?: 'inferior-derecha' | 'inferior-izquierda' | 'centro';
  qrUrl?: string;
  showDates?: boolean;
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY';
  showSerial?: boolean;
  backTextTop?: string;
  backTextMid?: string;
  backTextBot?: string;
  backLang?: 'en' | 'es';
  primary?: string;
  secondary?: string;
  accent?: string;
  digitalDark?: boolean;
}

const BACK_DEFAULTS = {
  en: {
    top: 'Property of RETH Corporation',
    mid: 'Unauthorized duplication or use is prohibited',
    bot: 'This card must be returned upon termination of employment',
    issued: 'Issued:',
    expires: 'Expires:',
    scan: 'Scan to verify employee record',
  },
  es: {
    top: 'Propiedad de RETH Corporation',
    mid: 'La duplicación o uso no autorizado está prohibido',
    bot: 'Esta tarjeta debe devolverse al finalizar el empleo',
    issued: 'Emitida:',
    expires: 'Vence:',
    scan: 'Escanea para verificar el registro',
  },
};

function fmtDate(d: string, format: 'DD/MM/YYYY' | 'MM/DD/YYYY') {
  if (!d) return '—';
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return d;
  const dd = String(parsed.getDate()).padStart(2, '0');
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const yyyy = parsed.getFullYear();
  return format === 'MM/DD/YYYY' ? `${mm}/${dd}/${yyyy}` : `${dd}/${mm}/${yyyy}`;
}

export default function CredentialBack({
  employeeCode,
  email,
  issueDate,
  expiryDate,
  serial,
  logoUrl,
  logoSize = 5,
  taglineTitle = 'RETH',
  taglineSubtitle = 'Internal Access System',
  logoPos = 'superior',
  taglineTitleSize = 2,
  taglineSubtitleSize = 1.2,
  showQR = true,
  qrSize = 20,
  qrPos = 'centro',
  qrUrl,
  showDates = true,
  dateFormat = 'DD/MM/YYYY',
  showSerial = true,
  backTextTop,
  backTextMid,
  backTextBot,
  backLang = 'en',
  primary = '#E63946',
  secondary = '#0f1f3a',
  accent = '#3B82F6',
  digitalDark = false,
}: Props) {
  const L = BACK_DEFAULTS[backLang];
  const verifyBase = qrUrl?.trim() || 'https://reth.app/verify';
  const qrData = encodeURIComponent(`${verifyBase}/${employeeCode}${email ? `?email=${email}` : ''}`);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}`;
  const resolvedLogo = logoUrl ? (logoUrl.startsWith('data:') || logoUrl.startsWith('http') ? logoUrl : `/imagotipo.png`) : null;
  const textTop = backTextTop?.trim() || L.top;
  const textMid = backTextMid?.trim() || L.mid;
  const textBot = backTextBot?.trim() || L.bot;
  const qrImg = (
    <Box sx={{ p: 0.6, bgcolor: 'white', borderRadius: 1, border: '1px solid #E5E7EB', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
      <Box component="img" src={qrSrc} alt="QR" sx={{ width: `${qrSize}mm`, height: `${qrSize}mm`, display: 'block', imageRendering: 'pixelated' }} />
    </Box>
  );

  const isSuperiorRight = logoPos === 'superior-derecha' || logoPos === 'esquina';
  const isInferiorRight = logoPos === 'inferior-derecha';

  return (
    <Box className="reth-cred" sx={{ p: 1, bgcolor: '#d1d5db', borderRadius: '10px', display: 'inline-block', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: -1, position: 'relative', zIndex: 2 }}>
        <Box sx={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #9ca3af', bgcolor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'white', border: '1px solid #9ca3af' }} />
        </Box>
        <Box sx={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', width: 2, height: 12, bgcolor: '#9ca3af', borderRadius: 1 }} />
        <Box sx={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', width: 18, height: 18, borderRadius: '50%', border: '2px solid #6b7280', bgcolor: 'transparent' }} />
      </Box>
      <Box
        sx={{
          width: '53.98mm',
          height: '85.6mm',
          bgcolor: digitalDark ? secondary : 'white',
          borderRadius: '6px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          border: digitalDark ? `1px solid ${primary}66` : '1px solid #e5e7eb',
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
        }}
      >
        {/* Top red curved — RETH with uploaded logo */}
        <Box sx={{ height: '14mm', bgcolor: primary, position: 'relative', overflow: 'hidden', flexShrink: 0, transition: 'background-color 0.2s ease' }}>
          <Box sx={{ position: 'absolute', inset: 0, opacity: 0.12, background: 'repeating-linear-gradient(135deg, transparent 0 6px, rgba(255,255,255,0.3) 6px 7px)', pointerEvents: 'none' }} />
          <Box
            sx={{
              position: 'absolute',
              top: '2mm',
              ...(isSuperiorRight
                ? { right: '3mm', left: 'auto', flexDirection: 'row-reverse', textAlign: 'right' }
                : { left: '3mm', right: 'auto', flexDirection: 'row', textAlign: 'left' }),
              display: 'flex',
              alignItems: 'center',
              gap: '1.5mm',
              zIndex: 2,
              maxWidth: '85%',
            }}
          >
            <Box
              component="img"
              src={resolvedLogo || "/reth_isotype_white.png"}
              alt="RETH"
              sx={{
                height: `${logoSize}mm`,
                maxHeight: `${logoSize}mm`,
                maxWidth: `${Math.max(20, logoSize * 2.5)}mm`,
                width: 'auto',
                objectFit: 'contain',
                filter: resolvedLogo ? 'none' : 'brightness(0) invert(1)',
                display: 'block',
                flexShrink: 0,
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/reth_isotype_white.png';
                (e.currentTarget as HTMLImageElement).style.filter = 'brightness(0) invert(1)';
              }}
            />
            <Box sx={{ minWidth: 0, textAlign: isSuperiorRight ? 'right' : 'left' }}>
              <Typography sx={{ color: 'white', fontSize: `${taglineTitleSize}mm`, fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{taglineTitle}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: `${taglineSubtitleSize}mm`, letterSpacing: '0.06em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{taglineSubtitle}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Institutional text */}
        <Box sx={{ px: 2.5, pt: 1.5, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 0.3 }}>
          <Typography sx={{ fontSize: '1.9mm', color: digitalDark ? '#f9fafb' : '#111827', fontWeight: 700, lineHeight: 1.3 }}>{textTop}</Typography>
          <Typography sx={{ fontSize: '1.7mm', color: primary, fontWeight: 600 }}>{textMid}</Typography>
          <Typography sx={{ fontSize: '1.6mm', color: digitalDark ? 'rgba(255,255,255,0.7)' : '#4B5563', lineHeight: 1.3 }}>{textBot}</Typography>
        </Box>

        {/* Validity dates */}
        {showDates && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4, py: 1, mt: 0.5, borderTop: digitalDark ? `1px solid ${primary}44` : '1px solid #f3f4f6', borderBottom: digitalDark ? `1px solid ${primary}44` : '1px solid #f3f4f6', mx: 2 }}>
            <Typography sx={{ fontSize: '1.9mm', color: digitalDark ? '#f9fafb' : '#111827' }}><Box component="span" sx={{ color: primary, fontWeight: 700 }}>{L.issued}</Box> {fmtDate(issueDate, dateFormat)}</Typography>
            <Typography sx={{ fontSize: '1.9mm', color: digitalDark ? '#f9fafb' : '#111827' }}><Box component="span" sx={{ color: primary, fontWeight: 700 }}>{L.expires}</Box> {fmtDate(expiryDate, dateFormat)}</Typography>
            {showSerial && <Typography sx={{ fontSize: '1.7mm', color: digitalDark ? 'rgba(255,255,255,0.65)' : '#6B7280', fontFamily: 'monospace', mt: 0.3 }}>{serial}</Typography>}
          </Box>
        )}
        {!showDates && showSerial && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.8, mt: 0.4 }}>
            <Typography sx={{ fontSize: '1.7mm', color: digitalDark ? 'rgba(255,255,255,0.65)' : '#6B7280', fontFamily: 'monospace' }}>{serial}</Typography>
          </Box>
        )}

        {/* QR — posición configurable */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: qrPos === 'centro' ? 'column' : 'row',
            alignItems: qrPos === 'centro' ? 'center' : qrPos === 'inferior-izquierda' ? 'flex-start' : 'flex-end',
            justifyContent: qrPos === 'centro' ? 'center' : 'flex-end',
            py: 1,
            px: 1.5,
            gap: 0.8,
            pb: qrPos === 'centro' ? 1 : 2,
          }}
        >
          {showQR && qrImg}
          {showQR && qrPos === 'centro' && (
            <Typography sx={{ fontSize: '1.6mm', color: '#6B7280', letterSpacing: '0.04em', fontWeight: 600 }}>{L.scan}</Typography>
          )}
        </Box>

        {/* Bottom dark navy — geometric + small logo */}
        <Box sx={{ height: '10mm', bgcolor: secondary, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, mt: 'auto' }}>
          <Box sx={{ position: 'absolute', bottom: -6, right: -12, width: '68%', height: '14mm', bgcolor: primary, borderRadius: '20mm 0 0 0', opacity: 0.95 }} />
          <Box sx={{ position: 'absolute', bottom: 2, right: 18, width: 30, height: 1, bgcolor: accent, opacity: 0.45, transform: 'rotate(-12deg)' }} />
          <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.4mm', position: 'relative', zIndex: 1 }}>123, Your Address Here</Typography>
          <Box component="img" src={resolvedLogo || "/reth_isotype_white.png"} alt="RETH" sx={{ height: `${Math.max(3, logoSize - 1)}mm`, opacity: 0.9, position: 'relative', zIndex: 1, filter: resolvedLogo ? 'none' : 'brightness(0) invert(1)' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        </Box>
      </Box>
    </Box>
  );
}
