import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null);
  const isAuthenticated = computed(() => profile.value !== null);

  function setProfile(userProfile: UserProfile): void {
    profile.value = userProfile;
  }

  function clearProfile(): void {
    profile.value = null;
  }

  return {
    profile,
    isAuthenticated,
    setProfile,
    clearProfile,
  };
});
