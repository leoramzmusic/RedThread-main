import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import TipRenderer from '../profile/TipRenderer';
import type { AdminTip } from '../../services/adminApi';

interface TipPreviewProps {
    tip: Partial<AdminTip>;
}

/** Live preview: builds a TipRenderer-compatible draft from the editor state. */
export default function TipPreview({ tip }: TipPreviewProps) {
    const [open, setOpen] = useState(false);

    const draft = {
        tip_key: tip.tip_key ?? 'draft',
        type: tip.type ?? 'drawer',
        section_key: tip.section_key ?? '',
        translation: tip.translations?.es ?? tip.translations?.en ?? {},
        translations: tip.translations ?? {},
        slides: tip.slides ?? [],
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
                Así verá el usuario el tip (idioma es).
            </Typography>
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
                        <TipRenderer tip={draft as never} onClose={() => setOpen(false)} />
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
