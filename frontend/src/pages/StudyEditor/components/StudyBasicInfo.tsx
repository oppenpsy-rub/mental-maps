import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Study } from '../../../types';
import { Button } from '../../../components/UI/Button';
import { Card } from '../../../components/UI/Card';
import { Heading2, Text, Label } from '../../../components/UI/Typography';

const InfoCard = styled(Card)`
  padding: 24px;
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
  
  &:disabled {
    background: ${props => props.theme.colors.gray[100]};
    color: ${props => props.theme.colors.gray[500]};
  }
`;

const TextArea = styled.textarea`
  padding: 8px 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
  
  &:disabled {
    background: ${props => props.theme.colors.gray[100]};
    color: ${props => props.theme.colors.gray[500]};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
`;

const ErrorText = styled(Text)`
  color: ${props => props.theme.colors.danger};
  font-size: 12px;
  margin: 0;
`;

interface StudyBasicInfoProps {
  study: Study;
  onSave: (studyData: Partial<Study>) => Promise<void>;
  saving: boolean;
  disabled?: boolean;
}

const StudyBasicInfo: React.FC<StudyBasicInfoProps> = ({
  study,
  onSave,
  saving,
  disabled = false
}) => {
  const [formData, setFormData] = useState({
    title: study.title || '',
    description: study.description || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Update form data when study changes
  useEffect(() => {
    setFormData({
      title: study.title || '',
      description: study.description || ''
    });
    setHasChanges(false);
  }, [study]);

  // Track changes
  useEffect(() => {
    const hasFormChanges = 
      formData.title !== (study.title || '') ||
      formData.description !== (study.description || '');
    
    setHasChanges(hasFormChanges);
  }, [formData, study]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Titel ist erforderlich';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Titel muss mindestens 3 Zeichen lang sein';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Titel darf maximal 200 Zeichen lang sein';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Beschreibung darf maximal 1000 Zeichen lang sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSave({
        title: formData.title.trim(),
        description: formData.description.trim()
      });
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleReset = () => {
    setFormData({
      title: study.title || '',
      description: study.description || ''
    });
    setErrors({});
    setHasChanges(false);
  };

  return (
    <InfoCard>
      <Heading2 style={{ marginBottom: '16px' }}>Grundinformationen</Heading2>
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="study-title">
            Titel *
          </Label>
          <Input
            id="study-title"
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Geben Sie einen aussagekräftigen Titel ein..."
            disabled={disabled || saving}
            maxLength={200}
          />
          {errors.title && <ErrorText>{errors.title}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="study-description">
            Beschreibung
          </Label>
          <TextArea
            id="study-description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Beschreiben Sie das Ziel und den Ablauf Ihrer Studie..."
            disabled={disabled || saving}
            maxLength={1000}
          />
          {errors.description && <ErrorText>{errors.description}</ErrorText>}
          <Text style={{ fontSize: '12px', color: '#6c757d', margin: '4px 0 0 0' }}>
            {formData.description.length}/1000 Zeichen
          </Text>
        </FormGroup>

        {hasChanges && (
          <ButtonGroup>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={saving}
            >
              Zurücksetzen
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving || disabled}
            >
              {saving ? 'Speichern...' : 'Speichern'}
            </Button>
          </ButtonGroup>
        )}
      </Form>
      
      {disabled && (
        <Text style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: '#fff3cd', 
          color: '#856404',
          borderRadius: '4px',
          fontSize: '14px',
          margin: '16px 0 0 0'
        }}>
          Diese Studie ist aktiv und kann nicht bearbeitet werden.
        </Text>
      )}
    </InfoCard>
  );
};

export default StudyBasicInfo;