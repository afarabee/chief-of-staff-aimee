import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reducer } from './use-toast';

describe('toast reducer', () => {
  const baseToast = {
    id: '1',
    title: 'Test',
    open: true,
    onOpenChange: () => {},
  };

  it('ADD_TOAST adds a toast to empty state', () => {
    const state = { toasts: [] };
    const result = reducer(state, { type: 'ADD_TOAST', toast: baseToast });
    expect(result.toasts).toHaveLength(1);
    expect(result.toasts[0].title).toBe('Test');
  });

  it('ADD_TOAST limits to 1 toast (TOAST_LIMIT)', () => {
    const state = { toasts: [{ ...baseToast, id: '1' }] };
    const result = reducer(state, {
      type: 'ADD_TOAST',
      toast: { ...baseToast, id: '2', title: 'New' },
    });
    expect(result.toasts).toHaveLength(1);
    expect(result.toasts[0].title).toBe('New');
  });

  it('UPDATE_TOAST updates an existing toast', () => {
    const state = { toasts: [baseToast] };
    const result = reducer(state, {
      type: 'UPDATE_TOAST',
      toast: { id: '1', title: 'Updated' },
    });
    expect(result.toasts[0].title).toBe('Updated');
  });

  it('DISMISS_TOAST sets open to false', () => {
    const state = { toasts: [baseToast] };
    const result = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' });
    expect(result.toasts[0].open).toBe(false);
  });

  it('REMOVE_TOAST removes a specific toast', () => {
    const state = { toasts: [baseToast] };
    const result = reducer(state, { type: 'REMOVE_TOAST', toastId: '1' });
    expect(result.toasts).toHaveLength(0);
  });

  it('REMOVE_TOAST without id clears all toasts', () => {
    const state = {
      toasts: [
        { ...baseToast, id: '1' },
        { ...baseToast, id: '2' },
      ],
    };
    const result = reducer(state, { type: 'REMOVE_TOAST', toastId: undefined });
    expect(result.toasts).toHaveLength(0);
  });
});
