import {
    Grid,
    Card,
    CardMedia,
    CardContent,
    Typography,
    Box,
    Checkbox,
    Chip,
    Radio,
    IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { AppearanceResource } from '../../types/appearance';
import { getMediaUrl } from '../../utils/media';

interface IconGalleryProps {
    resources: AppearanceResource[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
}

export default function IconGallery({ resources, selectedId, onSelect, onDelete }: IconGalleryProps) {
    if (resources.length === 0) {
        return (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                No hay iconos para mostrar.
            </Box>
        );
    }

    return (
        <Grid container spacing={3}>
            {resources.map((resource) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={resource._id}>
                    <Card
                        sx={{
                            height: '100%',
                            position: 'relative',
                            border: selectedId === resource._id ? '2px solid #E91e63' : '1px solid transparent',
                            cursor: 'pointer'
                        }}
                        onClick={() => resource._id && onSelect(resource._id)}
                    >
                        <Box sx={{ position: 'relative', pt: '100%', bgcolor: 'background.default' }}>
                            <CardMedia
                                component="img"
                                image={getMediaUrl(resource.url)}
                                alt="icon"
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    maxWidth: '80%',
                                    maxHeight: '80%',
                                    width: 'auto',
                                    height: 'auto'
                                }}
                            />
                        </Box>
                        <CardContent>
                            <Typography variant="body2" noWrap title={resource.url.split('/').pop()} sx={{ mb: 0.5, fontWeight: 'medium' }}>
                                {resource.url.split('/').pop()}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="caption" color="text.secondary" noWrap title={resource.resolution}>
                                    {resource.resolution || "Sin resolución"}
                                </Typography>
                                <Radio
                                    checked={resource.is_active}
                                    size="small"
                                    color="success"
                                    readOnly
                                />
                            </Box>

                            {resource.description && (
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, fontStyle: 'italic' }}>
                                    "{resource.description}"
                                </Typography>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                <Chip
                                    label={resource.is_active ? "Activo" : "Inactivo"}
                                    size="small"
                                    color={resource.is_active ? "success" : "default"}
                                    variant={resource.is_active ? "filled" : "outlined"}
                                />
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (resource._id) onDelete(resource._id);
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
}
