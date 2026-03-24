import React from 'react';
import { useTranslation } from 'react-i18next';

const StatusBadge = ({ status, className = '' }) => {
  const { t } = useTranslation();
  
  const getStatusLabel = (status) => {
    return t(`status.${status}`, status);
  };

  return (
    <span className={`status-badge status-${status} ${className}`}>
      {getStatusLabel(status)}
    </span>
  );
};

export default StatusBadge;
