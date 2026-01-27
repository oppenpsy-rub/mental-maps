import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, RefreshCw, Users, AlertCircle } from 'lucide-react';
import './index.css'; // Ensure we are using the global styles

const UserManagement = () => {
  const { t } = useTranslation();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/admin/pending-users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const users = await response.json();
        setPendingUsers(users);
      } else {
        const errorData = await response.json();
        setError(errorData.message || t('error.failed_to_load_users'));
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
      setError(t('error.network_error'));
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId, userName) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`/api/admin/approve-user/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccess(t('admin.user_approved_successfully', { name: userName }));
        setPendingUsers(pendingUsers.filter(user => user.id !== userId));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || t('error.failed_to_approve_user'));
      }
    } catch (error) {
      console.error('Error approving user:', error);
      setError(t('error.network_error'));
    }
  };

  const rejectUser = async (userId, userName) => {
    if (!window.confirm(t('admin.confirm_reject_user', { name: userName }))) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`/api/admin/reject-user/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccess(t('admin.user_rejected_successfully', { name: userName }));
        setPendingUsers(pendingUsers.filter(user => user.id !== userId));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || t('error.failed_to_reject_user'));
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      setError(t('error.network_error'));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="backend-container">
        <div className="backend-card">
          <h2 className="backend-title">{t('admin.user_management')}</h2>
          <div className="backend-empty-state">
             <div className="loading-spinner"></div>
             {t('common.loading')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="backend-container">
      <h2 className="backend-title">
        {t('admin.user_management')}
      </h2>
      
      <div className="backend-card">
        {error && (
          <div className="backend-alert backend-alert-error">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} />
              {error}
            </div>
            <button onClick={() => setError('')} className="alert-close">×</button>
          </div>
        )}
        
        {success && (
          <div className="backend-alert backend-alert-success">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Check size={20} />
              {success}
            </div>
            <button onClick={() => setSuccess('')} className="alert-close">×</button>
          </div>
        )}

        <div className="backend-card-header">
          <h3 className="backend-card-title">
            <Users size={20} />
            {t('admin.pending_registrations')} ({pendingUsers.length})
          </h3>
          <button onClick={fetchPendingUsers} className="btn-secondary" title={t('admin.refresh')}>
            <RefreshCw size={16} style={{ marginRight: '6px' }} />
            {t('admin.refresh')}
          </button>
        </div>
        
        {pendingUsers.length === 0 ? (
          <div className="backend-empty-state">
            <p>{t('admin.no_pending_registrations')}</p>
          </div>
        ) : (
          <div className="backend-table-container">
            <table className="backend-table">
              <thead>
                <tr>
                  <th>{t('admin.name')}</th>
                  <th>{t('admin.email')}</th>
                  <th>{t('admin.institution')}</th>
                  <th>{t('admin.department')}</th>
                  <th>{t('admin.registration_date')}</th>
                  <th>{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.institution || '-'}</td>
                    <td>{user.department || '-'}</td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => approveUser(user.id, user.name)}
                          className="btn-success"
                          title={t('admin.approve_user')}
                        >
                          <Check size={16} /> {t('admin.approve')}
                        </button>
                        <button
                          onClick={() => rejectUser(user.id, user.name)}
                          className="btn-danger"
                          title={t('admin.reject_user')}
                        >
                          <X size={16} /> {t('admin.reject')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
