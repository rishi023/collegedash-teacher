import { BottomSheet } from '@/components/BottomSheet'
import type { BottomSheetButton } from '@/components/BottomSheet'
import React, { createContext, useCallback, useContext, useState } from 'react'

interface ConfirmOptions {
  title: string
  message?: string | React.ReactNode
  buttons: BottomSheetButton[]
}

interface BottomSheetContextValue {
  showConfirm: (options: ConfirmOptions) => void
  showAlert: (title: string, message?: string | React.ReactNode) => void
  dismiss: () => void
}

const BottomSheetContext = createContext<BottomSheetContextValue | undefined>(undefined)

export function BottomSheetProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)

  const showConfirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
    setVisible(true)
  }, [])

  const showAlert = useCallback((title: string, message?: string | React.ReactNode) => {
    setOptions({
      title,
      message,
      buttons: [{ text: 'OK', onPress: () => {} }],
    })
    setVisible(true)
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    setOptions(null)
  }, [])

  return (
    <BottomSheetContext.Provider value={{ showConfirm, showAlert, dismiss }}>
      {children}
      <BottomSheet
        visible={visible}
        onDismiss={dismiss}
        title={options?.title}
        message={options?.message}
        buttons={options?.buttons}
      />
    </BottomSheetContext.Provider>
  )
}

export function useBottomSheet() {
  const ctx = useContext(BottomSheetContext)
  if (ctx === undefined) {
    throw new Error('useBottomSheet must be used within BottomSheetProvider')
  }
  return ctx
}
