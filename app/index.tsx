import { View } from 'react-native'

/**
 * Root index is a gate: LayoutContent in _layout handles initial routing
 * (onboarding first-time, then login or tabs). No redirect here to avoid
 * flashing login before onboarding.
 */
export default function Index() {
  return <View style={{ flex: 1 }} />
}
