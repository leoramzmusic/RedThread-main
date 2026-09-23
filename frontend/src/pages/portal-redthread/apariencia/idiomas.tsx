import { useEffect, useState } from 'react';
import { Box, Switch, Typography, Button, Paper, Stack } from '@mui/material';
import { supportedLanguages } from '../../../config/languages';
import appearanceService from '../../../services/appearanceService';
import { AppearanceType } from '../../../types/appearance';

export default function IdiomasAdminPage() {
  const [enabled, setEnabled] = useState<string[]>(supportedLanguages.map(l=>l.code));
  const [saving, setSaving] = useState(false);
  const [resourceId, setResourceId] = useState<string | null>(null);

  useEffect(() => {
    appearanceService.getResources(AppearanceType.LANDING_LANGUAGES as any).then(res => {
      const e = (res?.[0] as any)?.metadata?.enabled;
      if (Array.isArray(e)) setEnabled(e);
      if (res?.[0]?._id) setResourceId(res[0]._id);
    }).catch(()=>{});
  }, []);

  const toggle = (code: string) => setEnabled(prev => prev.includes(code) ? prev.filter(c=>c!==code) : [...prev, code]);
  const save = async () => {
    setSaving(true);
    try {
      if (resourceId) await appearanceService.updateResource(resourceId, {metadata:{enabled}} as any);
      else await appearanceService.createResource({type: AppearanceType.LANDING_LANGUAGES as any, platform: 'web' as any, url:'', metadata:{enabled}, is_active:true} as any);
    } finally { setSaving(false); }
  };

  return (
    <Box sx={{p:3}}>
      <Typography variant="h5" fontWeight={700}>Idiomas disponibles</Typography>
      <Typography variant="caption" color="text.secondary">Habilita/deshabilita idiomas para los usuarios. No fuerza el idioma de nadie.</Typography>
      <Paper sx={{p:2, mt:2}}>
        <Stack spacing={1}>
          {supportedLanguages.map(l => (
            <Box key={l.code} sx={{display:'flex', justifyContent:'space-between', alignItems:'center', py:0.5}}>
              <Typography>{l.label} ({l.code.toUpperCase()})</Typography>
              <Switch checked={enabled.includes(l.code)} onChange={()=>toggle(l.code)} inputProps={{ role: 'switch' } as any} />
            </Box>
          ))}
        </Stack>
        <Button variant="contained" onClick={save} disabled={saving} sx={{mt:2}}>{saving?'Guardando…':'Guardar'}</Button>
      </Paper>
    </Box>
  );
}
