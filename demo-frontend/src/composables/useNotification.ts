import { ref } from 'vue';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

const notifications = ref<Notification[]>([]);

export function useNotification() {
  function add(type: NotificationType, message: string): void {
    const id = crypto.randomUUID();
    notifications.value.push({ id, type, message });

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      remove(id);
    }, 5000);
  }

  function remove(id: string): void {
    notifications.value = notifications.value.filter((n) => n.id !== id);
  }

  return {
    notifications,
    add,
    remove,
  };
}
