import { NotificationCenter } from '../NavigationComponents';
import { render, screen } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';

describe('NotificationCenter', () => {
  const baseNotification = {
    id: '1',
    title: 'Test',
    message: 'Message',
    type: 'info' as const,
    timestamp: new Date().toISOString(),
  };

  it('renders mark all read button when there are unread notifications', async () => {
    const onMarkAllRead = jest.fn();
    render(
      <NotificationCenter
        notifications={[{ ...baseNotification, read: false }]}
        onNotificationClick={jest.fn()}
        onMarkAllRead={onMarkAllRead}
      />
    );

    const button = screen.getByText('Mark all read');
    expect(button).toBeInTheDocument();
    await userEvent.click(button);
    expect(onMarkAllRead).toHaveBeenCalled();
  });

  it('does not show mark all read button when all notifications are read', () => {
    render(
      <NotificationCenter
        notifications={[{ ...baseNotification, read: true }]}
        onNotificationClick={jest.fn()}
        onMarkAllRead={jest.fn()}
      />
    );

    expect(screen.queryByText('Mark all read')).not.toBeInTheDocument();
  });

  it('calls onNotificationClick when a notification is clicked', async () => {
    const onNotificationClick = jest.fn();
    render(
      <NotificationCenter
        notifications={[{ ...baseNotification, read: false }]}
        onNotificationClick={onNotificationClick}
        onMarkAllRead={jest.fn()}
      />
    );

    await userEvent.click(screen.getByText('Test'));
    expect(onNotificationClick).toHaveBeenCalledWith('1');
  });
});
