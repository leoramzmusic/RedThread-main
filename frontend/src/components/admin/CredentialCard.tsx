import { Box, Typography, SvgIcon } from '@mui/material';
import { getMediaUrl } from '../../utils/media';

function PersonGlyph() {
  return (
    <SvgIcon viewBox="0 0 24 24" sx={{ width: '12mm', height: '12mm', color: '#9ca3af' }}>
      <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </SvgIcon>
  );
}

interface Props {
  photoUrl?: string | null;
  firstName: string;
  lastName: string;
  departmentName?: string;
  roleName?: string;
  employeeCode: string;
  email?: string;
  phone?: string;
  birthDate?: string | null;
  logoUrl?: string | null;
  logoSize?: number;
  taglineTitle?: string;
  taglineSubtitle?: string;
  logoPos?: string;
  taglineTitleSize?: number;
  taglineSubtitleSize?: number;
  photoShape?: 'circle' | 'square' | 'diamond';
  photoBorderWidth?: number;
  photoBorderColor?: string;
  photoBg?: 'white' | 'gray' | 'transparent';
  photoShadow?: boolean;
  fontFamily?: string;
  boldName?: boolean;
  nameWeight?: number;
  italicRole?: boolean;
  nameSize?: number;
  roleSize?: number;
  nameColor?: string;
  roleColor?: string;
  nameCase?: 'uppercase' | 'capitalize' | 'none';
  textAlign?: 'center' | 'left' | 'right';
  autoFitText?: boolean;
  showDivider?: boolean;
  dividerColor?: string;
  showDOB?: boolean;
  showPhone?: boolean;
  showEmail?: boolean;
  showID?: boolean;
  showName?: boolean;
  showSerial?: boolean;
  showSeal?: boolean;
  topText?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  template?: string;
  decorLines?: boolean;
  decorThickness?: number;
  decorPos?: 'header' | 'franja' | 'diagonal' | 'marco';
  cardBgMode?: 'solid' | 'gradient' | 'pattern';
  watermarkUrl?: string | null;
  watermarkOpacity?: number;
  marginX?: number;
  contentGap?: number;
  digitalDark?: boolean;
}

export default function CredentialCard({
  photoUrl,
  firstName,
  lastName,
  departmentName,
  roleName,
  employeeCode,
  email,
  phone,
  birthDate,
  logoUrl,
  logoSize = 5,
  taglineTitle = 'RETH',
  taglineSubtitle = 'Internal Access System',
  logoPos = 'superior',
  taglineTitleSize = 2,
  taglineSubtitleSize = 1.2,
  photoShape = 'circle',
  photoBorderWidth = 3,
  photoBorderColor = '#ffffff',
  photoBg = 'white',
  photoShadow = true,
  fontFamily = 'Inter',
  boldName = true,
  nameWeight = 800,
  italicRole = true,
  nameSize = 3.1,
  roleSize = 1.9,
  nameColor = '#E63946',
  roleColor = '#6B7280',
  nameCase = 'uppercase',
  textAlign = 'center',
  autoFitText = true,
  showDivider = true,
  dividerColor,
  showDOB = true,
  showPhone = true,
  showEmail = true,
  showID = true,
  showName = true,
  showSerial = false,
  showSeal = true,
  topText = 'Valid with official photo',
  primary = '#E63946',
  secondary = '#0f1f3a',
  accent = '#3B82F6',
  template = 'geometrico',
  decorLines = true,
  decorThickness = 3,
  decorPos = 'header',
  cardBgMode = 'solid',
  watermarkUrl,
  watermarkOpacity = 0.08,
  marginX = 8.8,
  contentGap = 0.8,
  digitalDark = false,
}: Props) {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Employee';
  const dobText = birthDate ? new Date(birthDate).toLocaleDateString('en-GB') : '12/12/2000';
  const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(employeeCode)}&code=Code128&translate-esc=on&dpi=96`;
  const resolvedLogo = logoUrl ? (logoUrl.startsWith('data:') || logoUrl.startsWith('http') ? logoUrl : getMediaUrl(logoUrl)) : null;
  const isSuperiorRight = logoPos === 'superior-derecha' || logoPos === 'esquina';
  const isInferiorLeft = logoPos === 'inferior' || logoPos === 'inferior-izquierda';
  const isInferiorRight = logoPos === 'inferior-derecha';
  const isInferior = isInferiorLeft || isInferiorRight;
  const isSuperior = !isInferior;
  const photoBgColor = photoBg === 'gray' ? '#f3f4f6' : photoBg === 'transparent' ? 'transparent' : 'white';
  const photoShapeSx =
    photoShape === 'square'
      ? { borderRadius: '4px' }
      : photoShape === 'diamond'
        ? { borderRadius: 0, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }
        : { borderRadius: '50%' };
  const isMinimal = template === 'minimalista';
  const isCorp = template === 'corporativo';
  const cardBg =
    digitalDark
      ? secondary
      : cardBgMode === 'gradient'
        ? `linear-gradient(160deg, ${primary}0D 0%, ${secondary}14 100%)`
        : cardBgMode === 'pattern'
          ? `repeating-linear-gradient(135deg, transparent 0 10px, ${secondary}0A 10px 11px)`
          : 'white';
  const textColor = digitalDark ? '#f9fafb' : undefined;
  const subtleText = digitalDark ? 'rgba(255,255,255,0.75)' : '#4B5563';
  const labelColor = digitalDark ? primary : nameColor || primary;
  const decorStyle = decorLines
    ? decorPos === 'diagonal'
      ? { background: `repeating-linear-gradient(45deg, transparent 0 ${8 - Math.min(decorThickness, 6)}px, ${accent}${decorThickness > 3 ? '55' : '33'} ${8 - Math.min(decorThickness, 6)}px ${8}px)` }
      : {}
    : {};

  // Dynamic clamp and scaling to guarantee long names never overflow
  const nameLen = fullName.length;
  const lengthScale = autoFitText
    ? nameLen > 28
      ? 0.70
      : nameLen > 22
        ? 0.78
        : nameLen > 16
          ? 0.88
          : 1
    : 1;
  const computedNameSize = Number((nameSize * lengthScale).toFixed(2));
  const displayName = nameCase === 'capitalize'
    ? fullName.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    : nameCase === 'none'
      ? fullName
      : fullName.toUpperCase();

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
        id="reth-credential-front"
        sx={{
          width: '53.98mm',
          height: '85.6mm',
          bgcolor: cardBg,
          backgroundImage: cardBgMode === 'gradient' && !digitalDark ? `linear-gradient(160deg, ${primary}0D, ${secondary}14)` : cardBgMode === 'pattern' && !digitalDark ? `repeating-linear-gradient(135deg, transparent 0 10px, ${secondary}0A 10px 11px)` : undefined,
          borderRadius: '6px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          border: digitalDark ? `1px solid ${primary}66` : '1px solid #e5e7eb',
          transition: 'background-color 0.2s ease, background-image 0.2s ease, border-color 0.2s ease',
        }}
      >
        {/* Watermark opcional */}
        {watermarkUrl && (
          <Box
            component="img"
            src={watermarkUrl}
            alt=""
            aria-hidden
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '70%',
              maxHeight: '50%',
              objectFit: 'contain',
              opacity: watermarkOpacity,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}
        {/* Top geometric — plantilla según template */}
        <Box sx={{ height: '28mm', position: 'relative', overflow: 'hidden', flexShrink: 0, ...(decorLines && decorPos === 'diagonal' ? decorStyle : {}) }}>
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: secondary }} />
          {isMinimal && <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${decorThickness + 1}mm`, bgcolor: primary }} />}
          {!isMinimal && !isCorp && (
            <>
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '78%', height: '18mm', bgcolor: primary, borderRadius: '0 0 32mm 0' }} />
              <Box sx={{ position: 'absolute', top: 0, right: 0, width: '45%', height: '12mm', bgcolor: secondary, borderRadius: '0 0 0 24mm', opacity: 0.95 }} />
            </>
          )}
          {isCorp && (
            <>
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '16mm', bgcolor: primary }} />
              <Box sx={{ position: 'absolute', top: '16mm', left: 0, width: '100%', height: `${Math.max(2, decorThickness)}mm`, bgcolor: accent }} />
            </>
          )}
          {decorLines && decorPos === 'header' && (
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${Math.max(1, decorThickness)}px`, bgcolor: accent, opacity: 0.85, zIndex: 4 }} />
          )}
          {/* Logo + Tagline — posición dinámica y auto-ajuste */}
          {isSuperior && (
            <Box
              sx={{
                position: 'absolute',
                top: '2.5mm',
                ...(isSuperiorRight
                  ? { right: '3mm', left: 'auto', flexDirection: 'row-reverse', textAlign: 'right' }
                  : { left: '3.5mm', right: 'auto', flexDirection: 'row', textAlign: 'left' }),
                display: 'flex',
                alignItems: 'center',
                gap: '1.5mm',
                zIndex: 3,
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
                  flexShrink: 0,
                  display: 'block',
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/reth_isotype_white.png';
                  (e.currentTarget as HTMLImageElement).style.filter = 'brightness(0) invert(1)';
                }}
              />
              <Box sx={{ minWidth: 0, textAlign: isSuperiorRight ? 'right' : 'left' }}>
                <Typography
                  sx={{
                    color: 'white',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    lineHeight: 1.15,
                    fontSize: `${taglineTitleSize}mm`,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {taglineTitle}
                </Typography>
                <Typography
                  sx={{
                    color: 'rgba(255,255,255,0.88)',
                    letterSpacing: '0.04em',
                    lineHeight: 1.15,
                    fontSize: `${taglineSubtitleSize}mm`,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {taglineSubtitle}
                </Typography>
              </Box>
            </Box>
          )}
          {/* Left vertical stripe */}
          {!isMinimal && <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2.2mm', bgcolor: primary, zIndex: 1 }} />}
        </Box>

        {/* Photo — forma/borde/fondo/sombra configurables (pestaña Photo) */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: '-13mm', zIndex: 2, flexShrink: 0 }}>
          <Box
            sx={{
              width: '30mm',
              height: '30mm',
              ...photoShapeSx,
              border: photoBorderWidth > 0 ? `${photoBorderWidth}px solid ${photoBorderColor}` : 'none',
              boxShadow: photoShadow ? '0 2px 10px rgba(0,0,0,0.18)' : 'none',
              overflow: 'hidden',
              bgcolor: photoBgColor,
              outline: photoShape !== 'diamond' ? `2px solid ${primary}` : 'none',
              outlineOffset: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {photoUrl ? (
              <Box
                component="img"
                src={getMediaUrl(photoUrl)}
                alt={fullName}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <PersonGlyph />
            )}
          </Box>
        </Box>

        {/* Datos con Tipografía Avanzada */}
        <Box sx={{ flex: 1, px: `${marginX / 3.78}mm`, pt: 1, textAlign, display: 'flex', flexDirection: 'column', alignItems: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center', gap: contentGap, minWidth: 0, position: 'relative', zIndex: 1, transition: 'padding 0.15s ease, gap 0.15s ease' }}>
          {showName && (
            <Typography
              sx={{
                fontFamily: `${fontFamily}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
                fontWeight: boldName ? (nameWeight || 800) : 500,
                fontSize: autoFitText ? `clamp(10px, ${computedNameSize}mm, 18px)` : `${nameSize}mm`,
                lineHeight: 1.15,
                color: textColor || nameColor,
                letterSpacing: '-0.01em',
                textAlign,
                width: '100%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                transition: 'all 0.15s ease',
              }}
            >
              {displayName}
            </Typography>
          )}
          <Typography
            sx={{
              fontFamily: `${fontFamily}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
              fontSize: `${roleSize}mm`,
              color: textColor || roleColor,
              fontWeight: 600,
              fontStyle: italicRole ? 'italic' : 'normal',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              textAlign,
              width: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              transition: 'all 0.15s ease',
            }}
          >
            {roleName || departmentName || 'No department'}
          </Typography>
          {showDivider && (
            <Box
              sx={{
                width: 14,
                height: 1,
                bgcolor: dividerColor || labelColor,
                opacity: 0.65,
                my: 0.35,
                alignSelf: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
                transition: 'all 0.15s ease',
              }}
            />
          )}
          {(showID || showDOB || showEmail || showPhone || showSerial) && (
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0.15, textAlign: 'left', pl: 0.5, mt: showDivider ? 0 : 0.3 }}>
              {showID && <Typography sx={{ fontFamily: `${fontFamily}, sans-serif`, fontSize: '1.9mm', color: subtleText, display: 'flex', gap: 1 }}><Box component="span" sx={{ color: labelColor, fontWeight: 700, minWidth: 14 }}>ID</Box> : {employeeCode}</Typography>}
              {showDOB && <Typography sx={{ fontFamily: `${fontFamily}, sans-serif`, fontSize: '1.9mm', color: subtleText, display: 'flex', gap: 1 }}><Box component="span" sx={{ color: labelColor, fontWeight: 700, minWidth: 14 }}>DOB</Box> : {dobText}</Typography>}
              {showEmail && <Typography sx={{ fontFamily: `${fontFamily}, sans-serif`, fontSize: '1.9mm', color: subtleText, display: 'flex', gap: 1, minWidth: 0 }}><Box component="span" sx={{ color: labelColor, fontWeight: 700, flexShrink: 0 }}>Email</Box> <Box component="span" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 'clamp(7px, 1.1vw, 8px)' }}>: {email || 'no-email@reth.app'}</Box></Typography>}
              {showPhone && <Typography sx={{ fontFamily: `${fontFamily}, sans-serif`, fontSize: '1.9mm', color: subtleText, display: 'flex', gap: 1 }}><Box component="span" sx={{ color: labelColor, fontWeight: 700, flexShrink: 0 }}>Phone</Box> : {phone ? `+${phone.replace(/\D/g, '').slice(0, 3)} ${phone.replace(/\D/g, '').slice(3)}` : '+000 000 000'}</Typography>}
              {showSerial && <Typography sx={{ fontFamily: `${fontFamily}, sans-serif`, fontSize: '1.9mm', color: subtleText, display: 'flex', gap: 1 }}><Box component="span" sx={{ color: labelColor, fontWeight: 700, minWidth: 14 }}>SN</Box> : SN-{employeeCode}-MS</Typography>}
            </Box>
          )}
        </Box>

        {/* Código de barras / QR reducido + franja inferior */}
        <Box sx={{ px: 1.5, pb: 0.8, display: 'flex', alignItems: 'center', gap: 1, flexDirection: isInferiorRight ? 'row-reverse' : 'row' }}>
          {isInferior && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexShrink: 0, flexDirection: isInferiorRight ? 'row-reverse' : 'row' }}>
              <Box
                component="img"
                src={resolvedLogo || "/reth_isotype_white.png"}
                alt="RETH"
                sx={{
                  height: `${logoSize}mm`,
                  maxHeight: `${logoSize}mm`,
                  maxWidth: `${Math.max(16, logoSize * 2)}mm`,
                  width: 'auto',
                  objectFit: 'contain',
                }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/reth_isotype_white.png'; }}
              />
              <Box sx={{ textAlign: isInferiorRight ? 'right' : 'left' }}>
                <Typography sx={{ fontSize: `${taglineTitleSize}mm`, fontWeight: 800, lineHeight: 1.15, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{taglineTitle}</Typography>
                <Typography sx={{ fontSize: `${taglineSubtitleSize}mm`, color: '#6B7280', letterSpacing: '0.04em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{taglineSubtitle}</Typography>
              </Box>
            </Box>
          )}
          <Box component="img" src={barcodeUrl} alt="barcode" sx={{ flex: 1, height: '6mm', objectFit: 'contain', display: 'block' }} />
          {showSeal && (
            <Box sx={{ width: '10mm', height: '10mm', borderRadius: '50%', border: `1.5px solid ${primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.9 }}>
              <Typography sx={{ fontSize: '1.1mm', fontWeight: 800, color: primary, letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.1 }}>SEAL</Typography>
            </Box>
          )}
        </Box>
        {decorLines && decorPos === 'franja' && (
          <Box sx={{ height: `${decorThickness}px`, bgcolor: accent, opacity: 0.7, flexShrink: 0 }} />
        )}
        {decorLines && decorPos === 'marco' && (
          <Box sx={{ position: 'absolute', inset: 1, border: `${decorThickness}px solid ${accent}55`, borderRadius: 4, pointerEvents: 'none', zIndex: 5 }} />
        )}
        <Box sx={{ height: '4mm', bgcolor: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, transition: 'background-color 0.2s ease' }}>
          <Typography sx={{ color: 'white', fontSize: '1.7mm', fontWeight: 600, letterSpacing: '0.04em', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topText}</Typography>
        </Box>
      </Box>
    </Box>
  );
}
