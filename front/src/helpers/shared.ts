import { notification } from 'antd';

export const notificationMessage = (type: 'success' | 'error' | 'warning' | 'info', title: string, description: string = '') => {
  notification[type]({ title, description, duration: 5 });
};
