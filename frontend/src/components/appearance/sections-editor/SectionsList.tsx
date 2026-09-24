import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Paper, Switch, Chip, IconButton, Typography } from '@mui/material';
import { DragIndicator, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { resolveDragIndexes } from './reorder';
import { SECTION_CONTENT_TYPES, getSectionTitle, type LandingSection, type SectionContentType } from './types';
import type { Language } from '../navbar-editor/types';

interface SectionsListProps {
  sections: LandingSection[];
  lang?: Language;
  onReorder: (from: number, to: number) => void;
  onToggleVisible: (id: string, visible: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const contentLabel = (type: SectionContentType) =>
  SECTION_CONTENT_TYPES.find((c) => c.value === type)?.label ?? type;

function SortableRow({
  section,
  title,
  onToggleVisible,
  onEdit,
  onDelete,
}: {
  section: LandingSection;
  title: string;
  onToggleVisible: (id: string, visible: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      sx={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        p: 1.25,
        px: 1.5,
        mb: 1,
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 1.5 },
        flexWrap: 'wrap',
        bgcolor: 'background.paper',
      }}
    >
      <IconButton
        size="small"
        aria-label={`Reordenar ${title}`}
        {...attributes}
        {...listeners}
        sx={{ cursor: 'grab', touchAction: 'none', color: 'text.secondary' }}
      >
        <DragIndicator fontSize="small" />
      </IconButton>

      <Box sx={{ flex: '1 1 180px', minWidth: 0 }}>
        <Typography fontWeight={600} noWrap title={title}>
          {title}
        </Typography>
      </Box>

      <Chip size="small" label={contentLabel(section.contentType)} />
      {!section.visible && <Chip size="small" color="default" variant="outlined" label="Oculta" />}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: { xs: 'auto', sm: 0 } }}>
        <Switch
          size="small"
          checked={section.visible}
          onChange={(e) => onToggleVisible(section.id, e.target.checked)}
          inputProps={{ 'aria-label': `Visibilidad de ${title}` }}
        />
        <IconButton size="small" aria-label={`Editar ${title}`} onClick={() => onEdit(section.id)}>
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" aria-label={`Eliminar ${title}`} onClick={() => onDelete(section.id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
}

export default function SectionsList({
  sections,
  lang = 'en',
  onReorder,
  onToggleVisible,
  onEdit,
  onDelete,
}: SectionsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const indexes = resolveDragIndexes(sections, String(active.id), String(over.id));
    if (indexes) onReorder(indexes.from, indexes.to);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <Box data-testid="sections-list">
          {sections.map((section) => (
            <SortableRow
              key={section.id}
              section={section}
              title={getSectionTitle(section, lang)}
              onToggleVisible={onToggleVisible}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </Box>
      </SortableContext>
    </DndContext>
  );
}
