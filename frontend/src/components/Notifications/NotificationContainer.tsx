import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { removeNotification } from '../../store/slices/uiSlice';
import NotificationItem from './NotificationItem';

const Container = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  width: 100%;
  
  @media (max-width: 480px) {
    left: 20px;
    right: 20px;
    max-width: none;
  }
`;

const NotificationContainer: React.FC = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state: RootState) => state.ui);

  useEffect(() => {
    // Auto-remove notifications after 5 seconds
    notifications.forEach(notification => {
      const timer = setTimeout(() => {
        dispatch(removeNotification(notification.id));
      }, 5000);

      return () => clearTimeout(timer);
    });
  }, [notifications, dispatch]);

  const handleRemove = (id: string) => {
    dispatch(removeNotification(id));
  };

  return (
    <Container>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={handleRemove}
        />
      ))}
    </Container>
  );
};

export default NotificationContainer;