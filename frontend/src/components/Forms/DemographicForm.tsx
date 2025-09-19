import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LocationSelector } from '../Map/LocationSelector';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 800px;
  margin: 0 auto;
`;

const SectionCard = styled(Card)`
  padding: 24px;
`;

const SectionTitle = styled.h3`
  color: #212529;
  margin-bottom: 16px;
  font-size: 1.125rem;
  font-weight: 600;
`;

const SectionDescription = styled.p`
  color: #6c757d;
  margin-bottom: 20px;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #495057;
  font-size: 0.875rem;
`;

const Input = styled.input<{ $hasError?: boolean }>`
  padding: 12px 16px;
  border: 2px solid ${props => props.$hasError ? '#dc3545' : '#e9ecef'};
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#dc3545' : '#007bff'};
  }
  
  &::placeholder {
    color: #6c757d;
  }
`;

const Select = styled.select<{ $hasError?: boolean }>`
  padding: 12px 16px;
  border: 2px solid ${props => props.$hasError ? '#dc3545' : '#e9ecef'};
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#dc3545' : '#007bff'};
  }
`;

const ErrorMessage = styled.span`
  color: #dc3545;
  font-size: 0.75rem;
  margin-top: 4px;
`;

const LanguageSection = styled.div`
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const LanguageHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 12px;
`;

const LanguageTitle = styled.h4`
  color: #495057;
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
`;

const RemoveButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  
  &:hover {
    background: #c82333;
  }
`;

const AddButton = styled(Button)`
  align-self: flex-start;
  margin-top: 12px;
`;



const LocationInfo = styled.div`
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
  font-size: 0.875rem;
  color: #495057;
`;

const OptionalBadge = styled.span`
  background: #e9ecef;
  color: #6c757d;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

// Validation schema
const languageExposureSchema = z.object({
  language: z.string().min(1, 'Sprache ist erforderlich'),
  proficiency: z.enum(['basic', 'intermediate', 'advanced', 'native'], {
    errorMap: () => ({ message: 'Bitte wählen Sie ein Sprachniveau' })
  }),
  yearsOfExposure: z.number().min(0).max(100).optional()
});

const locationSchema = z.object({
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  coordinates: z.tuple([z.number(), z.number()]).optional()
});

const demographicSchema = z.object({
  age: z.number().min(16).max(120).optional(),
  gender: z.string().optional(),
  education: z.string().optional(),
  occupation: z.string().optional(),
  nativeLanguage: z.string().optional(),
  otherLanguages: z.array(z.string()).optional(),
  birthPlace: locationSchema.optional(),
  currentResidence: locationSchema.optional(),
  dialectBackground: z.string().optional(),
  languageExposure: z.array(languageExposureSchema).optional()
});

export type DemographicFormData = z.infer<typeof demographicSchema>;

interface DemographicFormProps {
  onSubmit: (data: DemographicFormData) => void;
  onSkip: () => void;
  isLoading?: boolean;
  initialData?: Partial<DemographicFormData>;
}

const DemographicForm: React.FC<DemographicFormProps> = ({
  onSubmit,
  onSkip,
  isLoading = false,
  initialData
}) => {
  const [selectedBirthLocation, setSelectedBirthLocation] = useState<[number, number] | null>(
    initialData?.birthPlace?.coordinates || null
  );
  const [selectedCurrentLocation, setSelectedCurrentLocation] = useState<[number, number] | null>(
    initialData?.currentResidence?.coordinates || null
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,

  } = useForm<DemographicFormData>({
    resolver: zodResolver(demographicSchema),
    defaultValues: {
      languageExposure: initialData?.languageExposure || [],
      otherLanguages: initialData?.otherLanguages || [],
      ...initialData
    }
  });

  const { fields: languageFields, append: addLanguage, remove: removeLanguage } = useFieldArray({
    control,
    name: 'languageExposure'
  });

  const { fields: otherLanguageFields, append: addOtherLanguage, remove: removeOtherLanguage } = useFieldArray({
    control,
    name: 'languageExposure'
  });

  const handleBirthLocationSelect = useCallback((coordinates: [number, number]) => {
    setSelectedBirthLocation(coordinates);
    setValue('birthPlace.coordinates', coordinates);
  }, [setValue]);

  const handleCurrentLocationSelect = useCallback((coordinates: [number, number]) => {
    setSelectedCurrentLocation(coordinates);
    setValue('currentResidence.coordinates', coordinates);
  }, [setValue]);

  const handleAddLanguage = () => {
    addLanguage({
      language: '',
      proficiency: 'basic',
      yearsOfExposure: undefined
    });
  };

  const handleAddOtherLanguage = () => {
    addOtherLanguage({ language: '', proficiency: 'basic' });
  };

  const proficiencyOptions = [
    { value: 'basic', label: 'Grundkenntnisse' },
    { value: 'intermediate', label: 'Mittlere Kenntnisse' },
    { value: 'advanced', label: 'Fortgeschrittene Kenntnisse' },
    { value: 'native', label: 'Muttersprache' }
  ];

  const educationOptions = [
    { value: '', label: 'Bitte wählen...' },
    { value: 'primary', label: 'Grundschule' },
    { value: 'secondary', label: 'Hauptschule/Realschule' },
    { value: 'high_school', label: 'Gymnasium/Abitur' },
    { value: 'vocational', label: 'Berufsausbildung' },
    { value: 'bachelor', label: 'Bachelor' },
    { value: 'master', label: 'Master' },
    { value: 'doctorate', label: 'Promotion' },
    { value: 'other', label: 'Andere' }
  ];

  return (
    <FormContainer>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Basic Demographics */}
        <SectionCard>
          <SectionTitle>
            Grundlegende Angaben
            <OptionalBadge>Optional</OptionalBadge>
          </SectionTitle>
          <SectionDescription>
            Diese Angaben helfen uns, die Ergebnisse besser zu verstehen. Alle Felder sind optional.
          </SectionDescription>
          
          <FormGrid>
            <FormGroup>
              <Label htmlFor="age">Alter</Label>
              <Input
                id="age"
                type="number"
                min="16"
                max="120"
                placeholder="z.B. 25"
                $hasError={!!errors.age}
                {...register('age', { valueAsNumber: true })}
              />
              {errors.age && <ErrorMessage>{errors.age.message}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="gender">Geschlecht</Label>
              <Input
                id="gender"
                type="text"
                placeholder="z.B. weiblich, männlich, divers"
                $hasError={!!errors.gender}
                {...register('gender')}
              />
              {errors.gender && <ErrorMessage>{errors.gender.message}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="education">Bildungsabschluss</Label>
              <Select
                id="education"
                $hasError={!!errors.education}
                {...register('education')}
              >
                {educationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {errors.education && <ErrorMessage>{errors.education.message}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="occupation">Beruf</Label>
              <Input
                id="occupation"
                type="text"
                placeholder="z.B. Lehrer, Student, Ingenieur"
                $hasError={!!errors.occupation}
                {...register('occupation')}
              />
              {errors.occupation && <ErrorMessage>{errors.occupation.message}</ErrorMessage>}
            </FormGroup>
          </FormGrid>
        </SectionCard>

        {/* Language Background */}
        <SectionCard>
          <SectionTitle>
            Sprachlicher Hintergrund
            <OptionalBadge>Optional</OptionalBadge>
          </SectionTitle>
          <SectionDescription>
            Informationen über Ihre Sprachkenntnisse und sprachliche Erfahrungen.
          </SectionDescription>

          <FormGroup>
            <Label htmlFor="nativeLanguage">Muttersprache</Label>
            <Input
              id="nativeLanguage"
              type="text"
              placeholder="z.B. Deutsch, Türkisch, Englisch"
              $hasError={!!errors.nativeLanguage}
              {...register('nativeLanguage')}
            />
            {errors.nativeLanguage && <ErrorMessage>{errors.nativeLanguage.message}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="dialectBackground">Dialekt-Hintergrund</Label>
            <Input
              id="dialectBackground"
              type="text"
              placeholder="z.B. Bayerisch, Plattdeutsch, Hochdeutsch"
              $hasError={!!errors.dialectBackground}
              {...register('dialectBackground')}
            />
            {errors.dialectBackground && <ErrorMessage>{errors.dialectBackground.message}</ErrorMessage>}
          </FormGroup>

          {/* Other Languages */}
          <div>
            <Label>Weitere Sprachen</Label>
            {otherLanguageFields.map((field, index) => (
              <div key={field.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <Input
                  placeholder="Sprache eingeben"
                  {...register(`otherLanguages.${index}` as const)}
                />
                <RemoveButton
                  type="button"
                  onClick={() => removeOtherLanguage(index)}
                >
                  Entfernen
                </RemoveButton>
              </div>
            ))}
            <AddButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddOtherLanguage}
            >
              Sprache hinzufügen
            </AddButton>
          </div>

          {/* Language Exposure */}
          <div>
            <Label>Detaillierte Sprachkenntnisse</Label>
            {languageFields.map((field, index) => (
              <LanguageSection key={field.id}>
                <LanguageHeader>
                  <LanguageTitle>Sprache {index + 1}</LanguageTitle>
                  <RemoveButton
                    type="button"
                    onClick={() => removeLanguage(index)}
                  >
                    Entfernen
                  </RemoveButton>
                </LanguageHeader>
                
                <FormGrid>
                  <FormGroup>
                    <Label>Sprache</Label>
                    <Input
                      placeholder="z.B. Englisch"
                      $hasError={!!errors.languageExposure?.[index]?.language}
                      {...register(`languageExposure.${index}.language` as const)}
                    />
                    {errors.languageExposure?.[index]?.language && (
                      <ErrorMessage>{errors.languageExposure[index]?.language?.message}</ErrorMessage>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label>Sprachniveau</Label>
                    <Controller
                      name={`languageExposure.${index}.proficiency` as const}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          $hasError={!!errors.languageExposure?.[index]?.proficiency}
                        >
                          {proficiencyOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      )}
                    />
                    {errors.languageExposure?.[index]?.proficiency && (
                      <ErrorMessage>{errors.languageExposure[index]?.proficiency?.message}</ErrorMessage>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label>Jahre der Erfahrung</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="z.B. 10"
                      $hasError={!!errors.languageExposure?.[index]?.yearsOfExposure}
                      {...register(`languageExposure.${index}.yearsOfExposure` as const, { valueAsNumber: true })}
                    />
                    {errors.languageExposure?.[index]?.yearsOfExposure && (
                      <ErrorMessage>{errors.languageExposure[index]?.yearsOfExposure?.message}</ErrorMessage>
                    )}
                  </FormGroup>
                </FormGrid>
              </LanguageSection>
            ))}
            <AddButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddLanguage}
            >
              Sprachkenntnisse hinzufügen
            </AddButton>
          </div>
        </SectionCard>

        {/* Geographic Background */}
        <SectionCard>
          <SectionTitle>
            Geografischer Hintergrund
            <OptionalBadge>Optional</OptionalBadge>
          </SectionTitle>
          <SectionDescription>
            Informationen über Ihre Herkunft und aktuellen Wohnort. Klicken Sie auf die Karte, um einen Ort auszuwählen.
          </SectionDescription>

          {/* Birth Place */}
          <FormGroup>
            <Label>Geburtsort</Label>
            <FormGrid>
              <Input
                placeholder="Stadt"
                {...register('birthPlace.city')}
              />
              <Input
                placeholder="Region/Bundesland"
                {...register('birthPlace.region')}
              />
              <Input
                placeholder="Land"
                {...register('birthPlace.country')}
              />
            </FormGrid>
            <LocationSelector
              onLocationSelect={handleBirthLocationSelect}
              selectedLocation={selectedBirthLocation}
              height="300px"
            />
            {selectedBirthLocation && (
              <LocationInfo>
                Ausgewählte Koordinaten: {selectedBirthLocation[1].toFixed(4)}, {selectedBirthLocation[0].toFixed(4)}
              </LocationInfo>
            )}
          </FormGroup>

          {/* Current Residence */}
          <FormGroup>
            <Label>Aktueller Wohnort</Label>
            <FormGrid>
              <Input
                placeholder="Stadt"
                {...register('currentResidence.city')}
              />
              <Input
                placeholder="Region/Bundesland"
                {...register('currentResidence.region')}
              />
              <Input
                placeholder="Land"
                {...register('currentResidence.country')}
              />
            </FormGrid>
            <LocationSelector
              onLocationSelect={handleCurrentLocationSelect}
              selectedLocation={selectedCurrentLocation}
              height="300px"
            />
            {selectedCurrentLocation && (
              <LocationInfo>
                Ausgewählte Koordinaten: {selectedCurrentLocation[1].toFixed(4)}, {selectedCurrentLocation[0].toFixed(4)}
              </LocationInfo>
            )}
          </FormGroup>
        </SectionCard>

        <ButtonGroup>
          <Button
            type="button"
            variant="secondary"
            onClick={onSkip}
            disabled={isLoading}
          >
            Überspringen
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Wird gespeichert...' : 'Weiter'}
          </Button>
        </ButtonGroup>
      </form>
    </FormContainer>
  );
};

export default DemographicForm;