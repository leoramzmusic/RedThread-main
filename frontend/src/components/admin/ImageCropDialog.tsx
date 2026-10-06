import React, { useCallback, useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Slider,
    Typography,
} from '@mui/material';
import Cropper, { type Area, type Point } from 'react-easy-crop';

interface ImageCropDialogProps {
    open: boolean;
    imageSrc: string | null;
    onClose: () => void;
    onApply: (blob: Blob) => void;
}

/** Renders imageSrc to canvas cropped to pixelCrop, returns JPEG blob. */
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageSrc;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(pixelCrop.width);
    canvas.height = Math.round(pixelCrop.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas no disponible');
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        canvas.width,
        canvas.height,
    );
    const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92),
    );
    if (!blob) throw new Error('No se pudo generar la imagen recortada');
    return blob;
}

export default function ImageCropDialog({ open, imageSrc, onClose, onApply }: ImageCropDialogProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);
    const [working, setWorking] = useState(false);

    const onCropComplete = useCallback((_: Area, pixels: Area) => {
        setCroppedPixels(pixels);
    }, []);

    const handleApply = async () => {
        if (!imageSrc || !croppedPixels) return;
        setWorking(true);
        try {
            const blob = await getCroppedImg(imageSrc, croppedPixels);
            onApply(blob);
        } finally {
            setWorking(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Recortar imagen (cuadrada 1:1)</DialogTitle>
            <DialogContent>
                <Box sx={{ position: 'relative', width: '100%', height: 360, bgcolor: 'black', borderRadius: 2, overflow: 'hidden' }}>
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        Zoom
                    </Typography>
                    <Slider
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.05}
                        onChange={(_, v) => setZoom(v as number)}
                        size="small"
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={working}>
                    Cancelar
                </Button>
                <Button variant="contained" onClick={() => void handleApply()} disabled={working || !croppedPixels}>
                    Usar recorte
                </Button>
            </DialogActions>
        </Dialog>
    );
}
