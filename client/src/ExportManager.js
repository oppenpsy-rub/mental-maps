import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { 
  FileText, Download, HelpCircle, Map as MapIcon, Users, Copy, Check, AlertCircle, 
  Trash2, Edit2, X
} from 'lucide-react';

function ExportManager({ studyId, studyName, onBack }) {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showQGISGuide, setShowQGISGuide] = useState(false);
  const [editingLimeSurveyId, setEditingLimeSurveyId] = useState(null);
  const [limeSurveyIdInput, setLimeSurveyIdInput] = useState('');

  const loadSummary = useCallback(async () => {
    try {
      const response = await axios.get(`/api/export/${studyId}/summary`);
      setSummary(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Zusammenfassung:', error);
      setMessage(t('error_loading_study_summary'));
    }
  }, [studyId, t]);

  const loadParticipants = useCallback(async () => {
    try {
      const response = await axios.get(`/api/export/${studyId}/participants`);
      setParticipants(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Teilnehmer:', error);
      setMessage(t('error_loading_participants'));
    }
  }, [studyId, t]);

  useEffect(() => {
    if (studyId) {
      loadSummary();
      loadParticipants();
    }
  }, [studyId, loadSummary, loadParticipants]);

  const downloadGeoJSON = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/export/${studyId}/geojson`, {
        responseType: 'blob'
      });
      
      // Erstelle einen Download-Link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `study_${studyId}_export.geojson`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setMessage(t('geojson_export_successful'));
    } catch (error) {
      console.error('Fehler beim GeoJSON-Export:', error);
      setMessage(t('error_geojson_export'));
    }
    setLoading(false);
  };

  const downloadCSV = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/export/${studyId}/csv`, {
        responseType: 'blob'
      });
      
      // Erstelle einen Download-Link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `study_${studyId}_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setMessage(t('csv_export_successful'));
    } catch (error) {
      console.error('Fehler beim CSV-Export:', error);
      setMessage(t('error_csv_export'));
    }
    setLoading(false);
  };

  const downloadParticipantGeoJSON = async (participantCode) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/export/${studyId}/participant/${participantCode}/geojson`, {
        responseType: 'blob'
      });
      
      // Erstelle einen Download-Link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `study_${studyId}_participant_${participantCode}_export.geojson`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setMessage(t('participant_geojson_export_successful', { participant: participantCode }));
    } catch (error) {
      console.error('Fehler beim Teilnehmer-GeoJSON-Export:', error);
      setMessage(t('error_participant_geojson_export'));
    }
    setLoading(false);
  };

  const copyParticipantCodes = () => {
    const codes = participants.map(p => p.code).join('\n');
    navigator.clipboard.writeText(codes).then(() => {
      setMessage(t('participant_codes_copied'));
      setTimeout(() => setMessage(''), 3000);
    }).catch(() => {
      setMessage(t('error_copying_codes'));
    });
  };

  const updateLimeSurveyId = async (participantId, participantCode, newLimeSurveyId) => {
    setLoading(true);
    try {
      const response = await axios.put(`/api/export/${studyId}/participants/${participantId}/limesurvey`, {
        limesurvey_id: newLimeSurveyId
      });
      
      if (response.data.success) {
        setMessage(t('limesurvey_id_updated_successfully', { participant: participantCode }));
        // Teilnehmer-Liste neu laden
        await loadParticipants();
        setEditingLimeSurveyId(null);
        setLimeSurveyIdInput('');
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der LimeSurvey ID:', error);
      if (error.response?.status === 404) {
        setMessage(t('participant_not_found'));
      } else {
        setMessage(t('error_updating_limesurvey_id'));
      }
    }
    setLoading(false);
  };

  const startEditingLimeSurveyId = (participantId, currentLimeSurveyId) => {
    setEditingLimeSurveyId(participantId);
    setLimeSurveyIdInput(currentLimeSurveyId || '');
  };

  const cancelEditingLimeSurveyId = () => {
    setEditingLimeSurveyId(null);
    setLimeSurveyIdInput('');
  };

  const deleteParticipant = async (participantId, participantCode) => {
    if (!window.confirm(t('confirm_delete_participant', { participant: participantCode }))) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete(`/api/export/${studyId}/participants/${participantId}`);
      
      if (response.data.success) {
        setMessage(t('participant_deleted_successfully', { participant: participantCode }));
        // Teilnehmer-Liste und Zusammenfassung neu laden
        await loadParticipants();
        await loadSummary();
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Teilnehmers:', error);
      if (error.response?.status === 404) {
        setMessage(t('participant_not_found'));
      } else {
        setMessage(t('error_deleting_participant'));
      }
    }
    setLoading(false);
  };

  return (
    <div className="export-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="export-title">
          {t('data_export_title')}: {studyName}
        </h1>
        <button
          onClick={onBack}
          style={{
            padding: '10px 16px',
            backgroundColor: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#7f8c8d'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#95a5a6'}
        >
          {t('back')}
        </button>
      </div>
      
      {/* Nachricht */}
      {message && (
        <div className={`export-message ${message.includes('Fehler') ? 'export-message-error' : 'export-message-success'}`}>
          {message.includes('Fehler') ? <AlertCircle size={20} /> : <Check size={20} />}
          {message}
        </div>
      )}

      {summary && (
        <div>
          {/* Studien-Zusammenfassung */}
          <div className="export-section export-section-primary">
            <h2 className="export-section-title text-primary">
              <FileText size={24} />
              {t('study_summary_title')}
            </h2>
            <div className="export-summary-grid">
              <div className="export-stat-card">
                <h4 className="export-stat-label">{t('participants_count')}</h4>
                <div className="export-stat-value">
                  {summary.statistics.participants}
                </div>
              </div>
              <div className="export-stat-card">
                <h4 className="export-stat-label">{t('responses_count')}</h4>
                <div className="export-stat-value">
                  {summary.statistics.responses}
                </div>
              </div>
              <div className="export-stat-card">
                <h4 className="export-stat-label">{t('questions_count')}</h4>
                <div className="export-stat-value">
                  {summary.study.questions}
                </div>
              </div>
              <div className="export-stat-card">
                <h4 className="export-stat-label">{t('answered_questions_count')}</h4>
                <div className="export-stat-value">
                  {summary.statistics.questions_answered}
                </div>
              </div>
            </div>
          </div>

          {/* Export-Optionen */}
          <div className="export-section export-section-secondary">
            <div className="export-options-header">
              <h2 className="export-options-title">
                <Download size={24} />
                {t('export_options_title')}
              </h2>
              <button
                onClick={() => setShowQGISGuide(true)}
                className="export-help-btn"
                title={t('qgis_guide_tooltip')}
              >
                <HelpCircle size={18} />
              </button>
            </div>
            <div className="export-options-grid">
              <button
                onClick={downloadGeoJSON}
                disabled={loading || summary.statistics.responses === 0}
                className="export-btn export-btn-primary"
              >
                <MapIcon size={20} />
                {t('geojson_for_qgis')}
              </button>
              
              <button
                onClick={downloadCSV}
                disabled={loading || summary.statistics.responses === 0}
                className="export-btn export-btn-secondary"
              >
                <FileText size={20} />
                {t('csv_for_excel_spss')}
              </button>
            </div>
            
            {summary.statistics.responses === 0 && (
              <p className="export-no-data-msg">
                {t('no_responses_available_export')}
              </p>
            )}
          </div>

          {/* Teilnehmer-Übersicht */}
          <div className="export-section export-section-tertiary">
            <div className="export-participants-header">
              <h2 className="export-section-title text-tertiary export-section-title-compact">
                <Users size={24} />
                {t('participants_overview')} ({participants.length})
              </h2>
              <button
                onClick={copyParticipantCodes}
                disabled={participants.length === 0}
                className="export-btn export-btn-tertiary export-btn-auto-width"
              >
                <Copy size={16} />
                {t('copy_codes')}
              </button>
            </div>

            {participants.length === 0 ? (
              <p className="export-empty-state">{t('no_participants')}</p>
            ) : (
              <div className="export-table-container">
                <table className="export-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>{t('limesurvey_id')}</th>
                      <th>{t('responses')}</th>
                      <th>{t('created')}</th>
                      <th>{t('export')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((participant, index) => (
                      <tr key={participant.id} className={index % 2 === 0 ? 'export-table-row-even' : 'export-table-row-odd'}>
                        <td className="export-code-cell">
                          {participant.code}
                        </td>
                        <td>
                          {editingLimeSurveyId === participant.id ? (
                            <div className="export-input-group">
                              <input
                                type="text"
                                value={limeSurveyIdInput}
                                onChange={(e) => setLimeSurveyIdInput(e.target.value)}
                                className="auth-input export-input-sm"
                                placeholder="LimeSurvey ID"
                                disabled={loading}
                              />
                              <button
                                onClick={() => updateLimeSurveyId(participant.id, participant.code, limeSurveyIdInput)}
                                disabled={loading}
                                className="export-btn-icon export-btn-success"
                                title={t('save')}
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={cancelEditingLimeSurveyId}
                                disabled={loading}
                                className="export-btn-icon export-btn-danger"
                                title={t('cancel')}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="export-input-group">
                              <span>{participant.limesurvey_id || '-'}</span>
                              <button
                                onClick={() => startEditingLimeSurveyId(participant.id, participant.limesurvey_id)}
                                disabled={loading}
                                className="export-btn-icon export-btn-icon-transparent"
                                title="LimeSurvey ID bearbeiten"
                              >
                                <Edit2 size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="export-text-center">
                          {participant.response_count}
                        </td>
                        <td>
                          {new Date(participant.created_at).toLocaleDateString('de-DE')}
                        </td>
                        <td>
                          <button
                            onClick={() => downloadParticipantGeoJSON(participant.code)}
                            disabled={loading || participant.response_count === 0}
                            className="export-btn-action export-btn-download"
                            title={participant.response_count === 0 ? t('no_responses_available') : t('download_geojson_for_participant')}
                          >
                            <Download size={14} />
                            GeoJSON
                          </button>
                        </td>
                        <td>
                          <button
                            onClick={() => deleteParticipant(participant.id, participant.code)}
                            disabled={loading}
                            className="export-btn-action export-btn-delete"
                            title={t('delete_participant')}
                          >
                            <Trash2 size={14} />
                            {t('delete')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* {t('questions_overview')} */}
          <div className="export-section">
            <h2 className="export-section-title">
              {t('questions_overview')}
            </h2>
            {summary.questions.map((question, index) => (
              <div key={index} className="export-question-card">
                <h4 className="export-question-header">
                  {t('question_number')} {index + 1}: {question.id}
                </h4>
                <p className="export-question-text">{question.text}</p>
                <div className="export-question-meta">
                  <span><strong>{t('question_type')}:</strong> {question.type}</span>
                  {question.audioFile && <span><strong>{t('audio_file')}:</strong> {question.audioFile}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QGIS Visualisierungsanleitung Modal */}
      {showQGISGuide && (
        <div className="export-modal-overlay">
          <div className="export-modal-content">
            <div className="export-modal-header">
              <h2 className="export-modal-title">
                {t('qgis_guide_title')}
              </h2>
              <button
                onClick={() => setShowQGISGuide(false)}
                className="export-btn-close-modal"
              >
                ×
              </button>
            </div>
            
            <div className="export-modal-body">
              <p className="export-modal-intro">
                {t('qgis_guide_intro')}
              </p>
              
              <div className="export-step-container">
                <h3 className="export-step-title">
                  {t('qgis_step1_title')}
                </h3>
                <p className="export-step-text">
                  {t('qgis_step1_text')}{' '}
                  <a 
                    href="https://qgis.org/download/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="export-link"
                  >
                    https://qgis.org/download/
                  </a>{' '}
                  {t('qgis_step1_download')}.
                </p>
              </div>
              
              <div className="export-step-container">
                <h3 className="export-step-title">
                  {t('qgis_step2_title')}
                </h3>
                <p className="export-step-text">
                  {t('qgis_step2_text')}
                </p>
              </div>
              
              <div className="export-step-container">
                <h3 className="export-step-title">
                  {t('qgis_step3_title')}
                </h3>
                <p className="export-step-text">
                  {t('qgis_step3_text')}
                </p>
              </div>

              <div className="export-step-container">
                <h3 className="export-step-title">
                  {t('qgis_step4_title')}
                </h3>
                <p className="export-step-text">
                  {t('qgis_step4_text')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExportManager;
