import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AnalysisFilters } from '../../types/analysis';

const FiltersContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const FiltersHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 24px;
`;

const FiltersTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
`;

const ClearButton = styled.button`
  padding: 8px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    background: #e5e7eb;
  }
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
`;

const FilterInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const MultiSelect = styled.div`
  border: 1px solid #d1d5db;
  border-radius: 4px;
  max-height: 120px;
  overflow-y: auto;
  background: white;
`;

const MultiSelectItem = styled.label`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: #f3f4f6;
  }
  
  input {
    margin-right: 8px;
  }
`;

const RangeInputGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const RangeInput = styled(FilterInput)`
  flex: 1;
`;

const RangeLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const ActiveFiltersContainer = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
`;

const ActiveFiltersTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
`;

const ActiveFilterTag = styled.span`
  display: inline-flex;
  align-items: center;
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 8px;
  margin-bottom: 4px;
`;

const RemoveFilterButton = styled.button`
  background: none;
  border: none;
  color: #1e40af;
  margin-left: 4px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    color: #1e3a8a;
  }
`;

interface InteractiveFiltersProps {
  filters: AnalysisFilters;
  onFiltersChange: (filters: AnalysisFilters) => void;
  availableParticipants?: Array<{ id: string; code: string }>;
  availableQuestions?: Array<{ id: string; title: string }>;
  demographicOptions?: Record<string, string[]>;
}

const InteractiveFilters: React.FC<InteractiveFiltersProps> = ({
  filters,
  onFiltersChange,
  availableParticipants = [],
  availableQuestions = [],
  demographicOptions = {}
}) => {
  const [localFilters, setLocalFilters] = useState<AnalysisFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilters = (newFilters: Partial<AnalysisFilters>) => {
    const updated = { ...localFilters, ...newFilters };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const clearAllFilters = () => {
    const emptyFilters: AnalysisFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const handleParticipantChange = (participantId: string, checked: boolean) => {
    const currentIds = localFilters.participantIds || [];
    const newIds = checked
      ? [...currentIds, participantId]
      : currentIds.filter(id => id !== participantId);
    
    updateFilters({ participantIds: newIds.length > 0 ? newIds : undefined });
  };

  const handleQuestionChange = (questionId: string, checked: boolean) => {
    const currentIds = localFilters.questionIds || [];
    const newIds = checked
      ? [...currentIds, questionId]
      : currentIds.filter(id => id !== questionId);
    
    updateFilters({ questionIds: newIds.length > 0 ? newIds : undefined });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const dateRange = localFilters.dateRange || { start: new Date(), end: new Date() };
    const newDateRange = {
      ...dateRange,
      [field]: new Date(value)
    };
    updateFilters({ dateRange: newDateRange });
  };

  const handleResponseTimeRangeChange = (field: 'min' | 'max', value: string) => {
    const responseTimeRange = localFilters.responseTimeRange || { min: 0, max: 300000 };
    const newRange = {
      ...responseTimeRange,
      [field]: parseInt(value) * 1000 // Convert seconds to milliseconds
    };
    updateFilters({ responseTimeRange: newRange });
  };

  const handleDemographicFilterChange = (key: string, value: string) => {
    const demographicFilters = localFilters.demographicFilters || {};
    const newFilters = value
      ? { ...demographicFilters, [key]: value }
      : { ...demographicFilters };
    
    if (!value) {
      delete newFilters[key];
    }
    
    updateFilters({ 
      demographicFilters: Object.keys(newFilters).length > 0 ? newFilters : undefined 
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.participantIds?.length) count++;
    if (localFilters.questionIds?.length) count++;
    if (localFilters.dateRange) count++;
    if (localFilters.responseTimeRange) count++;
    if (localFilters.demographicFilters && Object.keys(localFilters.demographicFilters).length > 0) count++;
    return count;
  };

  const renderActiveFilters = () => {
    const activeFilters: string[] = [];
    
    if (localFilters.participantIds?.length) {
      activeFilters.push(`${localFilters.participantIds.length} participants`);
    }
    if (localFilters.questionIds?.length) {
      activeFilters.push(`${localFilters.questionIds.length} questions`);
    }
    if (localFilters.dateRange) {
      activeFilters.push('Date range');
    }
    if (localFilters.responseTimeRange) {
      activeFilters.push('Response time range');
    }
    if (localFilters.demographicFilters) {
      Object.keys(localFilters.demographicFilters).forEach(key => {
        activeFilters.push(`${key}: ${localFilters.demographicFilters![key]}`);
      });
    }
    
    return activeFilters;
  };

  return (
    <FiltersContainer>
      <FiltersHeader>
        <FiltersTitle>Analysis Filters</FiltersTitle>
        <ClearButton onClick={clearAllFilters}>
          Clear All ({getActiveFiltersCount()})
        </ClearButton>
      </FiltersHeader>

      <FiltersGrid>
        {/* Participant Selection */}
        <FilterGroup>
          <FilterLabel>Participants</FilterLabel>
          <MultiSelect>
            {availableParticipants.map(participant => (
              <MultiSelectItem key={participant.id}>
                <input
                  type="checkbox"
                  checked={localFilters.participantIds?.includes(participant.id) || false}
                  onChange={(e) => handleParticipantChange(participant.id, e.target.checked)}
                />
                {participant.code}
              </MultiSelectItem>
            ))}
          </MultiSelect>
        </FilterGroup>

        {/* Question Selection */}
        <FilterGroup>
          <FilterLabel>Questions</FilterLabel>
          <MultiSelect>
            {availableQuestions.map(question => (
              <MultiSelectItem key={question.id}>
                <input
                  type="checkbox"
                  checked={localFilters.questionIds?.includes(question.id) || false}
                  onChange={(e) => handleQuestionChange(question.id, e.target.checked)}
                />
                {question.title}
              </MultiSelectItem>
            ))}
          </MultiSelect>
        </FilterGroup>

        {/* Date Range */}
        <FilterGroup>
          <FilterLabel>Date Range</FilterLabel>
          <RangeInputGroup>
            <RangeInput
              type="date"
              value={localFilters.dateRange?.start.toISOString().split('T')[0] || ''}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
            />
            <RangeLabel>to</RangeLabel>
            <RangeInput
              type="date"
              value={localFilters.dateRange?.end.toISOString().split('T')[0] || ''}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
            />
          </RangeInputGroup>
        </FilterGroup>

        {/* Response Time Range */}
        <FilterGroup>
          <FilterLabel>Response Time (seconds)</FilterLabel>
          <RangeInputGroup>
            <RangeInput
              type="number"
              placeholder="Min"
              value={localFilters.responseTimeRange ? localFilters.responseTimeRange.min / 1000 : ''}
              onChange={(e) => handleResponseTimeRangeChange('min', e.target.value)}
            />
            <RangeLabel>to</RangeLabel>
            <RangeInput
              type="number"
              placeholder="Max"
              value={localFilters.responseTimeRange ? localFilters.responseTimeRange.max / 1000 : ''}
              onChange={(e) => handleResponseTimeRangeChange('max', e.target.value)}
            />
          </RangeInputGroup>
        </FilterGroup>

        {/* Demographic Filters */}
        {Object.entries(demographicOptions).map(([key, options]) => (
          <FilterGroup key={key}>
            <FilterLabel>{key}</FilterLabel>
            <FilterSelect
              value={localFilters.demographicFilters?.[key] || ''}
              onChange={(e) => handleDemographicFilterChange(key, e.target.value)}
            >
              <option value="">All</option>
              {options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </FilterSelect>
          </FilterGroup>
        ))}
      </FiltersGrid>

      {getActiveFiltersCount() > 0 && (
        <ActiveFiltersContainer>
          <ActiveFiltersTitle>Active Filters:</ActiveFiltersTitle>
          {renderActiveFilters().map((filter, index) => (
            <ActiveFilterTag key={index}>
              {filter}
              <RemoveFilterButton onClick={() => {
                // This would need more specific logic to remove individual filters
                // For now, just show the clear all button
              }}>
                ×
              </RemoveFilterButton>
            </ActiveFilterTag>
          ))}
        </ActiveFiltersContainer>
      )}
    </FiltersContainer>
  );
};

export default InteractiveFilters;