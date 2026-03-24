// Translation helper functions for dynamic content

export const getRoleLabel = (t, role) => {
  return t(`roles.${role}`, role);
};

export const getStatusLabel = (t, status) => {
  return t(`status.${status}`, status);
};

export const getPositionLabel = (t, position) => {
  return t(`positions.${position}`, position);
};

export const getLeaveTypeLabel = (t, leaveType) => {
  return t(`leaveTypes.${leaveType}`, leaveType);
};

export const getMonthLabel = (t, monthNumber) => {
  return t(`months.${monthNumber}`, monthNumber);
};
