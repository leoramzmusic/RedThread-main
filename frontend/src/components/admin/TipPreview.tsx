import React, { useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import TipRenderer from '../profile/TipRenderer';
import { tipsApi, type AdminTip } from '../../services/adminApi';

interface TipPreviewProps {
    tip: Partial<AdminTip>;
    onChange: (next: Partial<AdminTip>) => void;
    persistedTipKey: string | null;
    readOnly?: boolean;
    onSnack: (msg: string, severity: 'success' | 'error') => void;
}

/** Live preview: builds a TipRenderer-compatible draft from the editor state. */
/** Image slots are clickable (admin-only): upload/replace on click, clear via × badge. */
export default function TipPreview({ tip, onChange, persistedTipKey, readOnly, onSnack }: TipPreviewProps) {
    const [open, setOpen] = useState(false);
    const [pendingSlot, setPendingSlot] = useState<{ index: number; field: 'ok' | 'ko' } | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const draft = {
        tip_key: tip.tip_key ?? 'draft',
        type: tip.type ?? 'drawer',
        section_key: tip.section_key ?? '',
        translation: tip.translations?.es ?? tip.translations?.en ?? {},
        translations: tip.translations ?? {},
        slides: tip.slides ?? [],
    };

    const handleSlotClick = (slideIndex: number, field: 'ok' | 'ko') => {
        if (readOnly) return;
        if (!persistedTipKey) {
            onSnack('Guarda el tip primero para poder subir imágenes', 'error');
            return;
        }
        setPendingSlot({ index: slideIndex, field });
        fileRef.current?.click();
    };

    const handleFile = async (file: File | undefined) => {
        if (!file || !pendingSlot || !persistedTipKey) return;
        setUploading(true);
        try {
            const { url } = await tipsApi.uploadImage(persistedTipKey, file);
            const slides = [...(tip.slides ?? [])];
            const key = pendingSlot.field === 'ok' ? 'ok_image_url' : 'ko_image_url';
            slides[pendingSlot.index] = { ...slides[pendingSlot.index], [key]: url };
            onChange({ ...tip, slides: slides.map((s, i) => ({ ...s, order: i })) });
            onSnack('Imagen subida (pulsa Guardar para aplicar)', 'success');
        } catch {
            onSnack('Error al subir la imagen', 'error');
        } finally {
            setUploading(false);
            setPendingSlot(null);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleSlotClear = (slideIndex: number, field: 'ok' | 'ko') => {
        if (readOnly) return;
        const slides = [...(tip.slides ?? [])];
        const key = field === 'ok' ? 'ok_image_url' : 'ko_image_url';
        slides[slideIndex] = { ...slides[slideIndex], [key]: '' };
        onChange({ ...tip, slides });
        onSnack('Imagen quitada (pulsa Guardar para aplicar)', 'success');
    };

    return (
        <Box
            sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 4,
                p: 2,
                bgcolor: 'background.paper',
                maxWidth: 400,
                mx: 'auto',
            }}
        >
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Vista previa
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Así verá el usuario el tip (idioma es). Clic en un recuadro para subir/reemplazar su imagen.
            </Typography>
            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => void handleFile(e.target.files?.[0])}
            />
            {/* Phone frame */}
            <Box
                sx={{
                    border: '8px solid #111',
                    borderRadius: 4,
                    overflow: 'hidden',
                    minHeight: 320,
                    position: 'relative',
                    bgcolor: 'background.default',
                }}
            >
                {!open ? (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 320,
                            p: 2,
                        }}
                    >
                        <Button variant="outlined" onClick={() => setOpen(true)}>
                            {(draft.translation as { trigger_button_text?: string })
                                ?.trigger_button_text ?? 'Abrir tip'}
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ p: 2 }}>
                        <TipRenderer
                            tip={draft as never}
                            onClose={() => setOpen(false)}
                            editable={!readOnly && !uploading}
                            onSlotClick={handleSlotClick}
                            onSlotClear={handleSlotClear}
                        />
                        <Button
                            size="small"
                            onClick={() => setOpen(false)}
                            sx={{ mt: 1 }}
                        >
                            Cerrar vista previa
                        </Button>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
