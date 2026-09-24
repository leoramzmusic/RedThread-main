import { Box, Paper, Typography, IconButton, Tooltip, Chip, Avatar } from '@mui/material';
import { DragIndicator, Edit, Delete, Visibility, VisibilityOff, CheckCircle, WarningAmber, Lock, LockOpen } from '@mui/icons-material';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { NavSection, Language, getPrimaryLabel, completionStatus, filledTranslations, LANGUAGES } from './types';
import { NavbarIcon } from './NavbarIcon';

interface NavbarSectionListProps {
  sections: NavSection[];
  currentLang: Language;
  onEdit: (section: NavSection) => void;
  onDelete: (id: string) => void;
  onToggle: (section: NavSection) => void;
  onToggleLock: (section: NavSection) => void;
  onReorder: (newSections: NavSection[]) => void;
}

export default function NavbarSectionList({ sections, currentLang, onEdit, onDelete, onToggle, onToggleLock, onReorder }: NavbarSectionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over?.id);
      onReorder(arrayMove(sections, oldIndex, newIndex).map((s, i) => ({ ...s, order: i })));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sections.map((section) => (
            <SortableNavItem
              key={section.id}
              section={section}
              currentLang={currentLang}
              onEdit={() => onEdit(section)}
              onDelete={() => onDelete(section.id)}
              onToggle={() => onToggle(section)}
              onToggleLock={() => onToggleLock(section)}
            />
          ))}
        </Box>
      </SortableContext>
    </DndContext>
  );
}

interface SortableNavItemProps {
  section: NavSection;
  currentLang: Language;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onToggleLock: () => void;
}

function SortableNavItem({ section, currentLang, onEdit, onDelete, onToggle, onToggleLock }: SortableNavItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const primary = getPrimaryLabel(section.translations, currentLang);
  const status = completionStatus(section.translations);
  const filled = filledTranslations(section.translations);
  const missingCurrentLang = !(section.translations[currentLang] || '').trim();
  const completionLabel = status.complete
    ? `Traducciones completas (${LANGUAGES.length} idiomas)`
    : `Faltan ${status.missing.length} de ${LANGUAGES.length} idiomas`;

  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Paper
        elevation={isDragging ? 3 : 1}
        sx={{
          p: 1,
          px: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderLeft: section.visible ? '4px solid #4CAF50' : '4px solid #9E9E9E',
          transition: 'background-color 0.2s ease',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <DragIndicator sx={{ color: 'text.secondary', cursor: 'grab', mr: 0.5, flexShrink: 0 }} />
        <Avatar
          variant="rounded"
          sx={{ width: 36, height: 36, bgcolor: 'rgba(140,140,160,0.16)', color: 'text.primary' }}
        >
          <NavbarIcon name={section.icon} />
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>{section.key}</Typography>
            <Tooltip title={filled || 'Sin traducciones'}>
              <Chip
                size="small"
                label={`${primary.code.toUpperCase()}: ${primary.label || '(vacío)'}`}
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            </Tooltip>
          </Box>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {section.route}
          </Typography>
        </Box>

        <Tooltip title={completionLabel}>
          <Chip
            aria-label={completionLabel}
            icon={status.complete ? <CheckCircle sx={{ fontSize: '1rem !important' }} /> : <WarningAmber sx={{ fontSize: '1rem !important' }} />}
            size="small"
            color={status.complete ? 'success' : 'error'}
            sx={{ fontSize: '0.7rem', height: 24 }}
          />
        </Tooltip>

        {missingCurrentLang && (
          <Tooltip title="Sin traducción en este idioma — se usará fallback en inglés">
            <Chip
              aria-label={`Sin traducción en ${currentLang.toUpperCase()}`}
              icon={<WarningAmber sx={{ fontSize: '1rem !important' }} />}
              size="small"
              color="warning"
              label={`${currentLang.toUpperCase()} ⚠️`}
              sx={{ fontSize: '0.7rem', height: 24 }}
            />
          </Tooltip>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <Tooltip title={section.locked ? 'Sección fija — no se puede eliminar ni ocultar' : 'Fijar sección'}>
            <IconButton size="small" onClick={onToggleLock} color={section.locked ? 'warning' : 'default'}>
              {section.locked ? <Lock /> : <LockOpen />}
            </IconButton>
          </Tooltip>
          <Tooltip title={section.locked ? 'Sección fija — no se puede ocultar' : (section.visible ? 'Visible' : 'Oculta')}>
            <IconButton size="small" onClick={onToggle} disabled={section.locked} color={section.visible ? 'success' : 'default'}>
              {section.visible ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={onEdit}><Edit /></IconButton>
          </Tooltip>
          <Tooltip title={section.locked ? 'Sección fija — no se puede eliminar' : 'Eliminar'}>
            <IconButton size="small" onClick={onDelete} color="error" disabled={section.locked}><Delete /></IconButton>
          </Tooltip>
        </Box>
      </Paper>
    </Box>
  );
}