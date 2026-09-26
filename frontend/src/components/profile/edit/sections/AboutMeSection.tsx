import { Grid, Paper, Typography, TextField, Box, IconButton, Button, Stack, InputBase, alpha, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'next-i18next';
import { Info as InfoIcon, Add as AddIcon, Close as CloseIcon, DragIndicator as DragIndicatorIcon, EditNote, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PromptItem } from '../types';



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
        borderColor: isDragging ? 'primary.main' : 'divider',
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

interface AboutMeSectionProps {
  control: any;
  setInfoDrawerOpen: (open: boolean) => void;
  prompts: PromptItem[];
  setPrompts: (prompts: PromptItem[]) => void;
  setPromptSelectorOpen: (open: boolean) => void;
  sensors: any;
  handleDragEnd: (event: DragEndEvent) => void;
  handleUpdatePrompt: (index: number, value: string) => void;
  handleRemovePrompt: (index: number) => void;
}

export default function AboutMeSection({
  control,
  setInfoDrawerOpen,
  prompts,
  setPrompts,
  setPromptSelectorOpen,
  sensors,
  handleDragEnd,
  handleUpdatePrompt,
  handleRemovePrompt
}: AboutMeSectionProps) {
  const { t } = useTranslation('common');

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
          <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" pr={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <EditNote color="action" />
              <Typography variant="h6">{t('profile.aboutMe', 'Sobre mí')}</Typography>
            </Box>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setInfoDrawerOpen(true);
              }}
            >
              <InfoIcon fontSize="small" color="action" />
            </IconButton>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
          {/* Bio Text Field */}
          <Controller
            name="bio"
            control={control}
            rules={{ maxLength: { value: 500, message: t('profile.max_chars_500', 'Máximo 500 caracteres') } }}
            render={({ field, fieldState: { error } }) => (
              <Box mb={3}>
                <Box position="relative">
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={4}
                    placeholder={t('profile.bio_placeholder', 'Esta es tu voz sin imagen. Haz que tu descripción sea tu primer gesto de conexión.')}
                    error={!!error}
                    helperText={error?.message}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        paddingBottom: '20px'
                      }
                    }}
                  />
                  <Typography
                    variant="caption"
                    color={field.value?.length > 500 ? "error" : "text.secondary"}
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 14,
                      pointerEvents: 'none'
                    }}
                  >
                    {500 - (field.value?.length || 0)}
                  </Typography>
                </Box>
              </Box>
            )}
          />

          {/* Prompts Section */}
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight={600}>
              {t('profile.prompts_title', 'Pregúntame sobre...')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('profile.prompts_subtitle', 'Escoge hasta 5 de las siguientes frases para que te conozcan un poco mejor')}
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
                    {t('profile.add_prompt', 'Agregar frase')}
                  </Button>
                </Box>
              )}
            </Stack>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
}
