import { useUIStore } from '../uiStore';

describe('uiStore notifications', () => {
  beforeEach(() => {
    const { clearNotifications } = useUIStore.getState();
    clearNotifications();
  });

  it('adds notifications with read set to false', () => {
    const { addNotification } = useUIStore.getState();
    addNotification({ type: 'info', message: 'Test', persistent: true });
    const notification = useUIStore.getState().notifications[0];
    expect(notification.read).toBe(false);
  });

  it('toggles notification read state', () => {
    const { addNotification, markNotificationRead } = useUIStore.getState();
    addNotification({ type: 'info', message: 'Test', persistent: true });
    const id = useUIStore.getState().notifications[0].id;

    markNotificationRead(id);
    expect(useUIStore.getState().notifications[0].read).toBe(true);

    markNotificationRead(id);
    expect(useUIStore.getState().notifications[0].read).toBe(false);
  });
});
