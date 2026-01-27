import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useUIStore, notify } from '@/store/ui-store'

describe('UI Store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Reset store state
    useUIStore.getState().closeAllModals()
    useUIStore.getState().clearNotifications()
    useUIStore.getState().hideTooltip()
    useUIStore.getState().setSidebarOpen(false)
    useUIStore.getState().setMenuOpen(false)
    useUIStore.getState().setFocusMode(false)
    useUIStore.getState().setFullscreen(false)
    useUIStore.getState().setCapsLockWarning(false)
    useUIStore.getState().setGlobalLoading(false)
    useUIStore.getState().setCommandPaletteQuery('')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ===========================================================================
  // Initial state
  // ===========================================================================
  describe('initial state', () => {
    it('should have no active modal', () => {
      expect(useUIStore.getState().activeModal).toBeNull()
    })

    it('should have all modals closed', () => {
      const { modals } = useUIStore.getState()
      Object.values(modals).forEach(modal => {
        expect(modal.isOpen).toBe(false)
      })
    })

    it('should have empty notifications', () => {
      expect(useUIStore.getState().notifications).toEqual([])
    })

    it('should have tooltip hidden', () => {
      expect(useUIStore.getState().tooltip.isVisible).toBe(false)
    })

    it('should have sidebar closed', () => {
      expect(useUIStore.getState().isSidebarOpen).toBe(false)
    })

    it('should have focus mode off', () => {
      expect(useUIStore.getState().isFocusMode).toBe(false)
    })

    it('should have fullscreen off', () => {
      expect(useUIStore.getState().isFullscreen).toBe(false)
    })

    it('should have caps lock warning off', () => {
      expect(useUIStore.getState().capsLockWarning).toBe(false)
    })

    it('should have global loading off', () => {
      expect(useUIStore.getState().globalLoading).toBe(false)
    })

    it('should have empty command palette query', () => {
      expect(useUIStore.getState().commandPaletteQuery).toBe('')
    })
  })

  // ===========================================================================
  // Modal actions
  // ===========================================================================
  describe('modal actions', () => {
    it('should open a modal', () => {
      useUIStore.getState().openModal('settings')

      const state = useUIStore.getState()
      expect(state.modals.settings.isOpen).toBe(true)
      expect(state.activeModal).toBe('settings')
    })

    it('should open a modal with data', () => {
      useUIStore.getState().openModal('confirm', { message: 'Are you sure?' })

      const state = useUIStore.getState()
      expect(state.modals.confirm.isOpen).toBe(true)
      expect(state.modals.confirm.data).toEqual({ message: 'Are you sure?' })
    })

    it('should close a specific modal', () => {
      useUIStore.getState().openModal('settings')
      useUIStore.getState().closeModal('settings')

      const state = useUIStore.getState()
      expect(state.modals.settings.isOpen).toBe(false)
      expect(state.activeModal).toBeNull()
    })

    it('should close the active modal when no specific modal is provided', () => {
      useUIStore.getState().openModal('settings')
      useUIStore.getState().closeModal()

      expect(useUIStore.getState().modals.settings.isOpen).toBe(false)
      expect(useUIStore.getState().activeModal).toBeNull()
    })

    it('should close all modals', () => {
      useUIStore.getState().openModal('settings')
      useUIStore.getState().openModal('about')

      useUIStore.getState().closeAllModals()

      const state = useUIStore.getState()
      expect(state.modals.settings.isOpen).toBe(false)
      expect(state.modals.about.isOpen).toBe(false)
      expect(state.activeModal).toBeNull()
    })

    it('should toggle a modal open', () => {
      useUIStore.getState().toggleModal('settings')
      expect(useUIStore.getState().modals.settings.isOpen).toBe(true)
    })

    it('should toggle a modal closed', () => {
      useUIStore.getState().openModal('settings')
      useUIStore.getState().toggleModal('settings')
      expect(useUIStore.getState().modals.settings.isOpen).toBe(false)
    })

    it('should not change activeModal when closing a non-active modal', () => {
      useUIStore.getState().openModal('settings')
      useUIStore.getState().openModal('about')
      // activeModal is 'about'

      useUIStore.getState().closeModal('settings')

      expect(useUIStore.getState().activeModal).toBe('about')
    })
  })

  // ===========================================================================
  // Notification actions
  // ===========================================================================
  describe('notification actions', () => {
    it('should add a notification and return its id', () => {
      const id = useUIStore.getState().addNotification({
        type: 'success',
        title: 'Test passed!',
      })

      expect(typeof id).toBe('string')
      const notifications = useUIStore.getState().notifications
      expect(notifications).toHaveLength(1)
      expect(notifications[0].title).toBe('Test passed!')
      expect(notifications[0].type).toBe('success')
    })

    it('should set default duration to 5000ms', () => {
      useUIStore.getState().addNotification({
        type: 'info',
        title: 'Info',
      })

      const notification = useUIStore.getState().notifications[0]
      expect(notification.duration).toBe(5000)
    })

    it('should set default dismissible to true', () => {
      useUIStore.getState().addNotification({
        type: 'info',
        title: 'Info',
      })

      const notification = useUIStore.getState().notifications[0]
      expect(notification.dismissible).toBe(true)
    })

    it('should remove a notification by id', () => {
      const id = useUIStore.getState().addNotification({
        type: 'error',
        title: 'Error!',
      })

      useUIStore.getState().removeNotification(id)
      expect(useUIStore.getState().notifications).toHaveLength(0)
    })

    it('should clear all notifications', () => {
      useUIStore.getState().addNotification({ type: 'success', title: 'One' })
      useUIStore.getState().addNotification({ type: 'error', title: 'Two' })

      useUIStore.getState().clearNotifications()
      expect(useUIStore.getState().notifications).toEqual([])
    })

    it('should add notification with custom duration', () => {
      useUIStore.getState().addNotification({
        type: 'warning',
        title: 'Warning',
        duration: 10000,
      })

      expect(useUIStore.getState().notifications[0].duration).toBe(10000)
    })

    it('should auto-remove notification after duration', () => {
      useUIStore.getState().addNotification({
        type: 'info',
        title: 'Auto-remove',
        duration: 3000,
      })

      expect(useUIStore.getState().notifications).toHaveLength(1)

      vi.advanceTimersByTime(3000)

      expect(useUIStore.getState().notifications).toHaveLength(0)
    })

    it('should not auto-remove persistent notification (duration: 0)', () => {
      useUIStore.getState().addNotification({
        type: 'info',
        title: 'Persistent',
        duration: 0,
      })

      vi.advanceTimersByTime(60000) // Wait a long time

      expect(useUIStore.getState().notifications).toHaveLength(1)
    })

    it('should add multiple notifications', () => {
      useUIStore.getState().addNotification({ type: 'success', title: 'First' })
      useUIStore.getState().addNotification({ type: 'error', title: 'Second' })
      useUIStore.getState().addNotification({ type: 'warning', title: 'Third' })

      expect(useUIStore.getState().notifications).toHaveLength(3)
    })

    it('should include createdAt timestamp', () => {
      vi.setSystemTime(new Date('2026-01-27T12:00:00.000Z'))
      useUIStore.getState().addNotification({ type: 'info', title: 'Timed' })

      const notification = useUIStore.getState().notifications[0]
      expect(notification.createdAt).toBe(new Date('2026-01-27T12:00:00.000Z').getTime())
    })
  })

  // ===========================================================================
  // Tooltip actions
  // ===========================================================================
  describe('tooltip actions', () => {
    it('should show tooltip with content and position', () => {
      useUIStore.getState().showTooltip('Help text', 100, 200)

      const { tooltip } = useUIStore.getState()
      expect(tooltip.isVisible).toBe(true)
      expect(tooltip.content).toBe('Help text')
      expect(tooltip.x).toBe(100)
      expect(tooltip.y).toBe(200)
    })

    it('should hide tooltip', () => {
      useUIStore.getState().showTooltip('Help text', 100, 200)
      useUIStore.getState().hideTooltip()

      expect(useUIStore.getState().tooltip.isVisible).toBe(false)
    })
  })

  // ===========================================================================
  // UI toggle actions
  // ===========================================================================
  describe('UI toggle actions', () => {
    it('should toggle sidebar', () => {
      expect(useUIStore.getState().isSidebarOpen).toBe(false)
      useUIStore.getState().toggleSidebar()
      expect(useUIStore.getState().isSidebarOpen).toBe(true)
      useUIStore.getState().toggleSidebar()
      expect(useUIStore.getState().isSidebarOpen).toBe(false)
    })

    it('should set sidebar open state directly', () => {
      useUIStore.getState().setSidebarOpen(true)
      expect(useUIStore.getState().isSidebarOpen).toBe(true)
      useUIStore.getState().setSidebarOpen(false)
      expect(useUIStore.getState().isSidebarOpen).toBe(false)
    })

    it('should toggle menu', () => {
      expect(useUIStore.getState().isMenuOpen).toBe(false)
      useUIStore.getState().toggleMenu()
      expect(useUIStore.getState().isMenuOpen).toBe(true)
    })

    it('should set menu open state directly', () => {
      useUIStore.getState().setMenuOpen(true)
      expect(useUIStore.getState().isMenuOpen).toBe(true)
    })

    it('should toggle focus mode', () => {
      expect(useUIStore.getState().isFocusMode).toBe(false)
      useUIStore.getState().toggleFocusMode()
      expect(useUIStore.getState().isFocusMode).toBe(true)
    })

    it('should set focus mode directly', () => {
      useUIStore.getState().setFocusMode(true)
      expect(useUIStore.getState().isFocusMode).toBe(true)
    })

    it('should toggle fullscreen', () => {
      expect(useUIStore.getState().isFullscreen).toBe(false)
      useUIStore.getState().toggleFullscreen()
      expect(useUIStore.getState().isFullscreen).toBe(true)
    })

    it('should set fullscreen directly', () => {
      useUIStore.getState().setFullscreen(true)
      expect(useUIStore.getState().isFullscreen).toBe(true)
    })
  })

  // ===========================================================================
  // Keyboard actions
  // ===========================================================================
  describe('keyboard actions', () => {
    it('should set caps lock warning', () => {
      useUIStore.getState().setCapsLockWarning(true)
      expect(useUIStore.getState().capsLockWarning).toBe(true)

      useUIStore.getState().setCapsLockWarning(false)
      expect(useUIStore.getState().capsLockWarning).toBe(false)
    })
  })

  // ===========================================================================
  // Loading actions
  // ===========================================================================
  describe('loading actions', () => {
    it('should set global loading state', () => {
      useUIStore.getState().setGlobalLoading(true)
      expect(useUIStore.getState().globalLoading).toBe(true)
    })

    it('should set loading with message', () => {
      useUIStore.getState().setGlobalLoading(true, 'Loading...')
      expect(useUIStore.getState().globalLoading).toBe(true)
      expect(useUIStore.getState().loadingMessage).toBe('Loading...')
    })

    it('should clear loading message when loading finishes', () => {
      useUIStore.getState().setGlobalLoading(true, 'Loading...')
      useUIStore.getState().setGlobalLoading(false)
      expect(useUIStore.getState().globalLoading).toBe(false)
      expect(useUIStore.getState().loadingMessage).toBeNull()
    })
  })

  // ===========================================================================
  // Command palette actions
  // ===========================================================================
  describe('command palette actions', () => {
    it('should set command palette query', () => {
      useUIStore.getState().setCommandPaletteQuery('theme')
      expect(useUIStore.getState().commandPaletteQuery).toBe('theme')
    })

    it('should clear command palette query', () => {
      useUIStore.getState().setCommandPaletteQuery('theme')
      useUIStore.getState().setCommandPaletteQuery('')
      expect(useUIStore.getState().commandPaletteQuery).toBe('')
    })
  })

  // ===========================================================================
  // Chat actions
  // ===========================================================================
  describe('chat actions', () => {
    it('should toggle chat', () => {
      expect(useUIStore.getState().isChatOpen).toBe(false)
      useUIStore.getState().toggleChat()
      expect(useUIStore.getState().isChatOpen).toBe(true)
    })

    it('should set chat room', () => {
      useUIStore.getState().setChatRoom('room-123', 'global', 'General')
      const state = useUIStore.getState()
      expect(state.chatRoomId).toBe('room-123')
      expect(state.chatRoomType).toBe('global')
      expect(state.chatRoomName).toBe('General')
    })

    it('should clear chat room', () => {
      useUIStore.getState().setChatRoom('room-123', 'global', 'General')
      useUIStore.getState().setChatRoom(null)
      expect(useUIStore.getState().chatRoomId).toBeNull()
    })

    it('should open direct message', () => {
      useUIStore.getState().openDirectMessage('dm-123', 'Alice')
      const state = useUIStore.getState()
      expect(state.chatRoomId).toBe('dm-123')
      expect(state.chatRoomType).toBe('direct')
      expect(state.chatRoomName).toBe('Alice')
      expect(state.isChatOpen).toBe(true)
    })
  })

  // ===========================================================================
  // Convenience notification helpers
  // ===========================================================================
  describe('notify convenience functions', () => {
    it('should add a success notification', () => {
      notify.success('Great!', 'All good')
      const notifications = useUIStore.getState().notifications
      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe('success')
      expect(notifications[0].title).toBe('Great!')
      expect(notifications[0].message).toBe('All good')
    })

    it('should add an error notification', () => {
      notify.error('Oops!', 'Something broke')
      const notifications = useUIStore.getState().notifications
      expect(notifications[0].type).toBe('error')
    })

    it('should add a warning notification', () => {
      notify.warning('Watch out!')
      const notifications = useUIStore.getState().notifications
      expect(notifications[0].type).toBe('warning')
    })

    it('should add an info notification', () => {
      notify.info('FYI')
      const notifications = useUIStore.getState().notifications
      expect(notifications[0].type).toBe('info')
    })
  })
})
