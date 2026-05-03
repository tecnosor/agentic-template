<script setup lang="ts">
import { computed } from 'vue';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface Props {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  type: 'button',
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const classes = computed(() => {
  const base = 'inline-flex items-center justify-center font-medium rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-blue-700 text-white hover:bg-blue-800 focus-visible:outline-blue-700',
    secondary: 'bg-transparent text-blue-700 border border-blue-700 hover:bg-blue-50 focus-visible:outline-blue-700',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:outline-gray-700',
  };

  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[52px]',
  };

  return [base, variants[props.variant], sizes[props.size]].join(' ');
});

function handleClick(event: MouseEvent): void {
  if (!props.disabled) {
    emit('click', event);
  }
}
</script>

<template>
  <button
    :type="props.type"
    :class="classes"
    :disabled="props.disabled"
    :aria-label="props.ariaLabel"
    @click="handleClick"
  >
    <slot />
  </button>
</template>
