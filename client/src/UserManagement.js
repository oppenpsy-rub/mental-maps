import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './UserManagement.css';

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
      const token = localStorage.getItem('token');
      
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
      const token = localStorage.getItem('token');
      
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
      const token = localStorage.getItem('token');
      
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
      <div className="user-management">
        <h2>{t('admin.user_management')}</h2>
        <div className="loading">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <h2>{t('admin.user_management')}</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')} className="alert-close">×</button>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess('')} className="alert-close">×</button>
        </div>
      )}

      <div className="pending-users-section">
        <h3>{t('admin.pending_registrations')} ({pendingUsers.length})</h3>
        
        {pendingUsers.length === 0 ? (
          <div className="no-pending-users">
            <p>{t('admin.no_pending_registrations')}</p>
          </div>
        ) : (
          <div className="users-table">
            <table>
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
                    <td className="actions">
                      <button
                        onClick={() => approveUser(user.id, user.name)}
                        className="btn btn-approve"
                        title={t('admin.approve_user')}
                      >
                        ✓ {t('admin.approve')}
                      </button>
                      <button
                        onClick={() => rejectUser(user.id, user.name)}
                        className="btn btn-reject"
                        title={t('admin.reject_user')}
                      >
                        ✗ {t('admin.reject')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="refresh-section">
        <button onClick={fetchPendingUsers} className="btn btn-secondary">
          {t('admin.refresh')}
        </button>
      </div>
    </div>
  );
};

export default UserManagement;