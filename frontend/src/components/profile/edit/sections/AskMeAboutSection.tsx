import { Grid, Paper, Typography, Box, Button, Stack, IconButton, InputBase, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, DragIndicator as DragIndicatorIcon, HelpOutline, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PromptItem } from '../types';

const DEFAULT_THEME_COLOR = '#FF6B6B';

interface SortablePromptItemProps {
    prompt: PromptItem;
    index: number;
    onRemove: (index: number) => void;
    onUpdate: (index: number, answer: string) => void;
}

function SortablePromptItem({ prompt, index, onRemove, onUpdate }: SortablePromptItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: prompt.question });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <Box
            ref={setNodeRef}
            style={style}
            sx={{
                p: 2,
                border: '1px solid',
                borderColor: isDragging ? DEFAULT_THEME_COLOR : 'divider',
                borderRadius: 1,
                position: 'relative',
                bgcolor: 'background.paper',
                '&:hover': {
                    borderColor: 'text.primary'
                }
            }}
        >
            {/* Drag Handle (Left) */}
            <Box
                {...attributes}
                {...listeners}
                sx={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'grab',
                    color: 'text.disabled',
                    '&:hover': { color: 'text.primary' },
                    zIndex: 2
                }}
            >
                <DragIndicatorIcon />
            </Box>

            {/* Delete Button (Top Right) */}
            <IconButton
                size="small"
                onClick={() => onRemove(index)}
                sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    color: 'text.secondary',
                    '&:hover': { color: 'error.main' },
                    zIndex: 2
                }}
            >
                <CloseIcon fontSize="small" />
            </IconButton>

            {/* Content Container (Padded left for handle) */}
            <Box pl={4}>
                {/* Header: Quotes + Question */}
                <Box display="flex" gap={0.5} mb={1} pr={4}>
                    <Typography
                        component="span"
                        sx={{
                            fontSize: '60px',
                            fontFamily: 'Georgia, serif',
                            color: 'error.main',
                            lineHeight: 0.3,
                            opacity: 0.8,
                            transform: 'translateY(20px)'
                        }}
                    >
                        "
                    </Typography>
                    <Typography
                        variant="h6"
                        gutterBottom
                        color="text.primary"
                        sx={{
                            pt: 1,
                            fontWeight: 'bold',
                            fontStyle: 'italic'
                        }}
                    >
                        {prompt.question}
                    </Typography>
                </Box>

                {/* Input Area */}
                <InputBase
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder="Escribe tu respuesta..."
                    value={prompt.answer}
                    onChange={(e) => onUpdate(index, e.target.value)}
                    sx={{
                        fontSize: '0.9rem',
                        fontStyle: 'italic',
                        color: 'text.secondary',
                        pb: 2
                    }}
                />

                {/* Character Counter */}
                <Typography
                    variant="caption"
                    color={(prompt.answer?.length || 0) > 500 ? "error" : "text.secondary"}
                    sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 14,
                        pointerEvents: 'none'
                    }}
                >
                    {500 - (prompt.answer?.length || 0)}
                </Typography>
            </Box>
        </Box>
    );
}

interface AskMeAboutSectionProps {
    prompts: PromptItem[];
    setPrompts: (prompts: PromptItem[]) => void;
    setPromptSelectorOpen: (open: boolean) => void;
    sensors: any;
    handleDragEnd: (event: DragEndEvent) => void;
    handleUpdatePrompt: (index: number, value: string) => void;
    handleRemovePrompt: (index: number) => void;
}

export default function AskMeAboutSection({
    prompts,
    setPrompts,
    setPromptSelectorOpen,
    sensors,
    handleDragEnd,
    handleUpdatePrompt,
    handleRemovePrompt
}: AskMeAboutSectionProps) {
    return (
        <Grid item xs={12}>
            <Accordion
                defaultExpanded
                sx={{
                    position: 'relative',
                    border: (theme) => '1px solid ' + theme.palette.divider,
                    boxShadow: 1,
                    backgroundImage: 'none',
                    borderRadius: '12px !important',
                    '&:before': { display: 'none' }
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ px: 3, py: 1 }}
                >
                    <Box display="flex" alignItems="center" gap={1}>
                        <HelpOutline color="action" />
                        <Typography variant="h6">Pregúntame sobre...</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Escoge hasta 5 de las siguientes frases para que te conozcan un poco mejor
                    </Typography>

                    <Stack spacing={2}>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={prompts.map(p => p.question)}
                                strategy={verticalListSortingStrategy}
                            >
                                {prompts.map((prompt, index) => (
                                    <SortablePromptItem
                                        key={prompt.question}
                                        prompt={prompt}
                                        index={index}
                                        onRemove={handleRemovePrompt}
                                        onUpdate={handleUpdatePrompt}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        {prompts.length < 5 && (
                            <Box
                                p={3}
                                border="2px dashed"
                                borderColor="divider"
                                borderRadius={1}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                sx={{
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: 'text.primary',
                                        bgcolor: 'action.hover'
                                    }
                                }}
                                onClick={() => setPromptSelectorOpen(true)}
                            >
                                <Button startIcon={<AddIcon />} sx={{ color: 'text.secondary' }}>
                                    Agregar frase
                                </Button>
                            </Box>
                        )}
                    </Stack>
                </AccordionDetails>
            </Accordion>
        </Grid>
    );
}
