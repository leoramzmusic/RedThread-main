import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AdminLayout from '../../../components/layout/AdminLayout';

export default function AdminEventos() {
  const router = useRouter();

  // Placeholder data
  const eventos = [
    { id: '1', nombre: 'Evento de ejemplo', fecha: '2025-12-01', activo: true },
  ];

  return (
    <AdminLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <IconButton onClick={() => router.push('/portal-redthread')}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight={700}>
              Gestión de Eventos
            </Typography>
          </Box>

          <Box display="flex" justifyContent="flex-end" mb={3}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => alert('Crear evento - Funcionalidad pendiente')}
            >
              Crear Evento
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Fecha</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell align="right"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {eventos.map((evento) => (
                  <TableRow key={evento.id}>
                    <TableCell>{evento.nombre}</TableCell>
                    <TableCell>{evento.fecha}</TableCell>
                    <TableCell>{evento.activo ? 'Activo' : 'Inactivo'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => alert('Editar - Pendiente')}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => alert('Eliminar - Pendiente')}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Container>
    </AdminLayout>
  );
}
