import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { Button } from '../../../components/UI/Button';
import { Card } from '../../../components/UI/Card';
import { Heading2, Heading3, Text, Label } from '../../../components/UI/Typography';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled(Card)`
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${props => props.theme.colors.gray[500]};
  
  &:hover {
    color: ${props => props.theme.colors.gray[700]};
  }
`;

const UploadSection = styled.div`
  margin-bottom: 32px;
`;

const DropZone = styled.div<{ $isDragOver: boolean; $hasFile: boolean }>`
  border: 2px dashed ${props => 
    props.$hasFile 
      ? props.theme.colors.success 
      : props.$isDragOver 
        ? props.theme.colors.primary 
        : props.theme.colors.border
  };
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  background: ${props => 
    props.$hasFile 
      ? '#f8fff8' 
      : props.$isDragOver 
        ? '#f0f8ff' 
        : props.theme.colors.gray[50]
  };
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: #f0f8ff;
  }
`;

const HiddenFileInput = styled.input.attrs({ type: 'file' })`
  display: none;
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  margin-top: 16px;
`;

const FileIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${props => props.theme.colors.primary};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
`;

const FileDetails = styled.div`
  flex: 1;
`;

const FileName = styled(Text)`
  margin: 0 0 4px 0;
  font-weight: 500;
`;

const FileSize = styled(Text)`
  margin: 0;
  font-size: 12px;
  color: ${props => props.theme.colors.gray[600]};
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.danger};
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    background: ${props => props.theme.colors.gray[100]};
    border-radius: 4px;
  }
`;

const MetadataSection = styled.div`
  margin-bottom: 24px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${props => props.theme.colors.gray[200]};
  border-radius: 4px;
  overflow: hidden;
  margin-top: 16px;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  background: ${props => props.theme.colors.primary};
  width: ${props => props.$progress}%;
  transition: width 0.3s ease;
`;

const ErrorText = styled(Text)`
  color: ${props => props.theme.colors.danger};
  font-size: 12px;
  margin: 0;
`;

const SuccessText = styled(Text)`
  color: ${props => props.theme.colors.success};
  font-size: 12px;
  margin: 0;
`;

interface AudioUploadInterfaceProps {
  studyId: string;
  onClose: () => void;
}

interface AudioMetadata {
  speaker: string;
  dialect: string;
  recordingLocation: string;
  description: string;
  language: string;
}

const AudioUploadInterface: React.FC<AudioUploadInterfaceProps> = ({
  studyId,
  onClose
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [metadata, setMetadata] = useState<AudioMetadata>({
    speaker: '',
    dialect: '',
    recordingLocation: '',
    description: '',
    language: 'de'
  });

  const acceptedFormats = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return 'Nur MP3, WAV und OGG Dateien sind erlaubt';
    }
    
    if (file.size > maxFileSize) {
      return 'Datei ist zu groß (max. 50MB)';
    }
    
    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    setSuccess(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMetadataChange = (field: keyof AudioMetadata, value: string) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      // TODO: Implement actual file upload
      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('metadata', JSON.stringify(metadata));
      formData.append('studyId', studyId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setSuccess('Audio-Datei erfolgreich hochgeladen');
      
      // Reset form after success
      setTimeout(() => {
        handleRemoveFile();
        setMetadata({
          speaker: '',
          dialect: '',
          recordingLocation: '',
          description: '',
          language: 'de'
        });
        setSuccess(null);
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ModalContent>
        <ModalHeader>
          <Heading2>Audio-Datei hochladen</Heading2>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>

        <UploadSection>
          <Heading3 style={{ marginBottom: '16px' }}>Datei auswählen</Heading3>
          
          <DropZone
            $isDragOver={isDragOver}
            $hasFile={!!selectedFile}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <HiddenFileInput
              ref={fileInputRef}
              accept={acceptedFormats.join(',')}
              onChange={handleFileInputChange}
            />
            
            {selectedFile ? (
              <div>
                <Text style={{ color: '#28a745', fontWeight: '500', margin: '0 0 8px 0' }}>
                  ✓ Datei ausgewählt
                </Text>
                <Text style={{ margin: '0' }}>
                  Klicken Sie hier, um eine andere Datei auszuwählen
                </Text>
              </div>
            ) : (
              <div>
                <Text style={{ fontWeight: '500', margin: '0 0 8px 0' }}>
                  Datei hierher ziehen oder klicken zum Auswählen
                </Text>
                <Text style={{ fontSize: '12px', color: '#6c757d', margin: '0' }}>
                  Unterstützte Formate: MP3, WAV, OGG (max. 50MB)
                </Text>
              </div>
            )}
          </DropZone>

          {selectedFile && (
            <FileInfo>
              <FileIcon>🎵</FileIcon>
              <FileDetails>
                <FileName>{selectedFile.name}</FileName>
                <FileSize>{formatFileSize(selectedFile.size)}</FileSize>
              </FileDetails>
              <RemoveButton onClick={handleRemoveFile}>
                ✕
              </RemoveButton>
            </FileInfo>
          )}

          {uploading && (
            <ProgressBar>
              <ProgressFill $progress={uploadProgress} />
            </ProgressBar>
          )}

          {error && <ErrorText style={{ marginTop: '8px' }}>{error}</ErrorText>}
          {success && <SuccessText style={{ marginTop: '8px' }}>{success}</SuccessText>}
        </UploadSection>

        {selectedFile && (
          <MetadataSection>
            <Heading3 style={{ marginBottom: '16px' }}>Metadaten</Heading3>
            
            <Form>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormGroup>
                  <Label>Sprecher</Label>
                  <Input
                    type="text"
                    value={metadata.speaker}
                    onChange={(e) => handleMetadataChange('speaker', e.target.value)}
                    placeholder="Name oder ID des Sprechers"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Dialekt/Varietät</Label>
                  <Input
                    type="text"
                    value={metadata.dialect}
                    onChange={(e) => handleMetadataChange('dialect', e.target.value)}
                    placeholder="z.B. Bairisch, Schwäbisch"
                  />
                </FormGroup>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormGroup>
                  <Label>Aufnahmeort</Label>
                  <Input
                    type="text"
                    value={metadata.recordingLocation}
                    onChange={(e) => handleMetadataChange('recordingLocation', e.target.value)}
                    placeholder="Stadt, Region"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Sprache</Label>
                  <Select
                    value={metadata.language}
                    onChange={(e) => handleMetadataChange('language', e.target.value)}
                  >
                    <option value="de">Deutsch</option>
                    <option value="en">Englisch</option>
                    <option value="fr">Französisch</option>
                    <option value="it">Italienisch</option>
                    <option value="es">Spanisch</option>
                    <option value="other">Andere</option>
                  </Select>
                </FormGroup>
              </div>

              <FormGroup>
                <Label>Beschreibung</Label>
                <Input
                  type="text"
                  value={metadata.description}
                  onChange={(e) => handleMetadataChange('description', e.target.value)}
                  placeholder="Zusätzliche Informationen zur Aufnahme"
                />
              </FormGroup>
            </Form>
          </MetadataSection>
        )}

        <ButtonGroup>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={uploading}
          >
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? `Hochladen... ${uploadProgress}%` : 'Hochladen'}
          </Button>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

export default AudioUploadInterface;