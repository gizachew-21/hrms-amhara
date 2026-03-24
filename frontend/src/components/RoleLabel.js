import React from 'react';
import { useTranslation } from 'react-i18next';

const RoleLabel = ({ role, className = '' }) => {
  const { t } = useTranslation();
  
  const getRoleLabel = (role) => {
    return t(`roles.${role}`, role);
  };

  return (
    <span className={className}>
      {getRoleLabel(role)}
    </span>
  );
};

export default RoleLabel;
