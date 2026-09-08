import { useState } from 'react';

interface ExtractedData {
  name?: string;
  birth_date?: string;
}

interface UseIdentityVerificationProps {
  onSuccess?: (data: ExtractedData) => void;
  onError?: (error: Error) => void;
  onDelete?: () => void;
}

export const useIdentityVerification = ({ onSuccess, onError, onDelete }: UseIdentityVerificationProps = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  const handleSubmit = async (documentType: string, file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('document_type', documentType);
      formData.append('file', file);

      // Use apiClient which automatically handles authentication
      const { default: apiClient } = await import('@/services/api');
      console.log('Sending request to /profiles/upload-identity...');
      const response = await apiClient.post('/profiles/upload-identity', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Response received:', response.data);
      const { extracted_data } = response.data;
      
      // Update message based on success
      if (extracted_data?.name) {
        setMessage(`✓ Documento procesado. Nombre extraído: ${extracted_data.name}`);
      } else {
        setMessage('Documento recibido. No se pudo leer el nombre automáticamente, será revisado manualmente.');
      }
      
      setShowMessage(true);
      setIsDialogOpen(false);

      // Call success callback
      if (onSuccess) {
        onSuccess(extracted_data);
      }

      return extracted_data;
    } catch (error) {
      console.error('Error uploading identity:', error);
      setMessage('Error al subir el documento. Por favor intenta de nuevo.');
      setShowMessage(true);
      
      if (onError) {
        onError(error as Error);
      }
      
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    console.log('[DELETE] Starting document deletion...');
    try {
      const { default: apiClient } = await import('@/services/api');
      console.log('[DELETE] Calling DELETE /profiles/identity-document');
      await apiClient.delete('/profiles/identity-document');
      
      console.log('[DELETE] Document deleted successfully');
      setMessage('✓ Documento eliminado exitosamente');
      setShowMessage(true);
      
      // Call delete callback
      if (onDelete) {
        console.log('[DELETE] Calling onDelete callback (will reload page)');
        onDelete();
      }
    } catch (error: any) {
      console.error('[DELETE] Error deleting document:', error);
      
      // If 404, document already deleted - treat as success
      if (error.response?.status === 404) {
        console.log('[DELETE] Document not found (404), treating as success');
        setMessage('✓ Documento eliminado exitosamente');
        setShowMessage(true);
        
        if (onDelete) {
          console.log('[DELETE] Calling onDelete callback after 404');
          onDelete();
        }
      } else {
        const errorMsg = error.response?.data?.detail || 'Error al eliminar el documento';
        console.error('[DELETE] Error message:', errorMsg);
        setMessage(errorMsg);
        setShowMessage(true);
        
        if (onError) {
          onError(error as Error);
        }
      }
    }
  };

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);
  const closeMessage = () => setShowMessage(false);

  return {
    isUploading,
    isDialogOpen,
    message,
    showMessage,
    handleSubmit,
    handleDelete,
    openDialog,
    closeDialog,
    closeMessage,
  };
};
