import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Question } from '../../../types';
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
  max-width: 600px;
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

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
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

const TextArea = styled.textarea`
  padding: 8px 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  
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

const ConfigSection = styled.div`
  padding: 16px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  background: ${props => props.theme.colors.gray[50]};
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  margin: 0;
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

interface QuestionEditorProps {
  studyId: string;
  questionId?: string | null;
  existingQuestion?: Question;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  studyId,
  questionId,
  existingQuestion,
  onSave,
  onCancel
}) => {
  const isEditing = !!questionId;
  
  const [formData, setFormData] = useState({
    questionText: '',
    questionType: 'map_drawing' as Question['questionType'],
    configuration: {} as any
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Load question data if editing
  useEffect(() => {
    if (isEditing && existingQuestion) {
      setFormData({
        questionText: existingQuestion.questionText,
        questionType: existingQuestion.questionType,
        configuration: existingQuestion.configuration || {}
      });
    }
  }, [isEditing, existingQuestion]);

  const questionTypes = [
    { value: 'map_drawing', label: 'Karten-Zeichnung' },
    { value: 'audio_response', label: 'Audio-Antwort' },
    { value: 'heatmap', label: 'Heatmap' },
    { value: 'point_selection', label: 'Punkt-Auswahl' },
    { value: 'area_selection', label: 'Bereich-Auswahl' },
    { value: 'rating', label: 'Bewertung' },
    { value: 'demographic', label: 'Demografie' }
  ];

  const drawingTools = [
    { value: 'pen', label: 'Stift' },
    { value: 'line', label: 'Linie' },
    { value: 'polygon', label: 'Polygon' },
    { value: 'circle', label: 'Kreis' },
    { value: 'text', label: 'Text' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.questionText.trim()) {
      newErrors.questionText = 'Fragetext ist erforderlich';
    } else if (formData.questionText.trim().length < 10) {
      newErrors.questionText = 'Fragetext muss mindestens 10 Zeichen lang sein';
    }

    // Type-specific validation
    if (formData.questionType === 'map_drawing') {
      if (!formData.configuration.allowedDrawingTools || formData.configuration.allowedDrawingTools.length === 0) {
        newErrors.configuration = 'Mindestens ein Zeichenwerkzeug muss ausgewählt werden';
      }
    }

    if (formData.questionType === 'rating') {
      if (!formData.configuration.ratingScale?.min || !formData.configuration.ratingScale?.max) {
        newErrors.configuration = 'Bewertungsskala muss definiert werden';
      } else if (formData.configuration.ratingScale.min >= formData.configuration.ratingScale.max) {
        newErrors.configuration = 'Minimum muss kleiner als Maximum sein';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleConfigurationChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      configuration: { ...prev.configuration, [field]: value }
    }));
    
    // Clear configuration errors
    if (errors.configuration) {
      setErrors(prev => ({ ...prev, configuration: '' }));
    }
  };

  const handleDrawingToolsChange = (tool: string, checked: boolean) => {
    const currentTools = formData.configuration.allowedDrawingTools || [];
    const newTools = checked
      ? [...currentTools, tool]
      : currentTools.filter((t: string) => t !== tool);
    
    handleConfigurationChange('allowedDrawingTools', newTools);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    
    try {
      // Create question object
      const question: Question = {
        id: questionId || existingQuestion?.id || `temp-${Math.random().toString(36).substr(2, 9)}`, // Use existing ID if editing
        studyId,
        questionText: formData.questionText.trim(),
        questionType: formData.questionType,
        configuration: formData.configuration,
        orderIndex: existingQuestion?.orderIndex || 0 // Preserve existing order or set to 0
      };

      onSave(question);
    } catch (error) {
      console.error('Failed to save question:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderTypeSpecificConfiguration = () => {
    switch (formData.questionType) {
      case 'map_drawing':
        return (
          <ConfigSection>
            <Heading3 style={{ marginBottom: '12px' }}>Zeichenwerkzeuge</Heading3>
            <Text style={{ marginBottom: '8px' }}>
              Wählen Sie die verfügbaren Zeichenwerkzeuge:
            </Text>
            <CheckboxGroup>
              {drawingTools.map(tool => (
                <CheckboxItem key={tool.value}>
                  <Checkbox
                    checked={(formData.configuration.allowedDrawingTools || []).includes(tool.value)}
                    onChange={(e) => handleDrawingToolsChange(tool.value, e.target.checked)}
                  />
                  {tool.label}
                </CheckboxItem>
              ))}
            </CheckboxGroup>
            {errors.configuration && <ErrorText style={{ marginTop: '8px' }}>{errors.configuration}</ErrorText>}
          </ConfigSection>
        );

      case 'heatmap':
        return (
          <ConfigSection>
            <Heading3 style={{ marginBottom: '12px' }}>Heatmap-Einstellungen</Heading3>
            <FormGroup>
              <Label htmlFor="heatmap-radius">Radius (Pixel)</Label>
              <Input
                id="heatmap-radius"
                type="number"
                value={formData.configuration.heatmapSettings?.radius || 20}
                onChange={(e) => handleConfigurationChange('heatmapSettings', {
                  ...formData.configuration.heatmapSettings,
                  radius: parseInt(e.target.value)
                })}
                min="5"
                max="100"
              />
            </FormGroup>
          </ConfigSection>
        );

      case 'rating':
        return (
          <ConfigSection>
            <Heading3 style={{ marginBottom: '12px' }}>Bewertungsskala</Heading3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormGroup>
                <Label htmlFor="rating-min">Minimum</Label>
                <Input
                  id="rating-min"
                  type="number"
                  value={formData.configuration.ratingScale?.min || 1}
                  onChange={(e) => handleConfigurationChange('ratingScale', {
                    ...formData.configuration.ratingScale,
                    min: parseInt(e.target.value)
                  })}
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="rating-max">Maximum</Label>
                <Input
                  id="rating-max"
                  type="number"
                  value={formData.configuration.ratingScale?.max || 5}
                  onChange={(e) => handleConfigurationChange('ratingScale', {
                    ...formData.configuration.ratingScale,
                    max: parseInt(e.target.value)
                  })}
                />
              </FormGroup>
            </div>
            {errors.configuration && <ErrorText style={{ marginTop: '8px' }}>{errors.configuration}</ErrorText>}
          </ConfigSection>
        );

      case 'point_selection':
        return (
          <ConfigSection>
            <Heading3 style={{ marginBottom: '12px' }}>Punkt-Auswahl</Heading3>
            <FormGroup>
              <Label htmlFor="max-points">Maximale Anzahl Punkte</Label>
              <Input
                id="max-points"
                type="number"
                value={formData.configuration.maxPoints || 1}
                onChange={(e) => handleConfigurationChange('maxPoints', parseInt(e.target.value))}
                min="1"
                max="20"
              />
            </FormGroup>
          </ConfigSection>
        );

      case 'area_selection':
        return (
          <ConfigSection>
            <Heading3 style={{ marginBottom: '12px' }}>Bereich-Auswahl</Heading3>
            <FormGroup>
              <Label htmlFor="max-areas">Maximale Anzahl Bereiche</Label>
              <Input
                id="max-areas"
                type="number"
                value={formData.configuration.maxAreas || 1}
                onChange={(e) => handleConfigurationChange('maxAreas', parseInt(e.target.value))}
                min="1"
                max="10"
              />
            </FormGroup>
          </ConfigSection>
        );

      default:
        return null;
    }
  };

  return (
    <ModalOverlay onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <ModalContent>
        <ModalHeader>
          <Heading2>{isEditing ? 'Frage bearbeiten' : 'Neue Frage erstellen'}</Heading2>
          <CloseButton onClick={onCancel}>&times;</CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="question-text">
              Fragetext *
            </Label>
            <TextArea
              id="question-text"
              value={formData.questionText}
              onChange={(e) => handleInputChange('questionText', e.target.value)}
              placeholder="Geben Sie hier Ihre Frage ein..."
              maxLength={500}
            />
            {errors.questionText && <ErrorText>{errors.questionText}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="question-type">
              Fragetyp *
            </Label>
            <Select
              id="question-type"
              value={formData.questionType}
              onChange={(e) => handleInputChange('questionType', e.target.value)}
            >
              {questionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </FormGroup>

          {renderTypeSpecificConfiguration()}

          <ButtonGroup>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
            >
              {saving ? 'Speichern...' : (isEditing ? 'Aktualisieren' : 'Erstellen')}
            </Button>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default QuestionEditor;