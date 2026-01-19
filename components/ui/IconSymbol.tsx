// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
export type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'ellipsis.circle.fill': 'more-horiz',
  'gearshape.fill': 'settings',
  'questionmark.circle.fill': 'help',
  'info.circle.fill': 'info',
  'shield.fill': 'security',
  'doc.text.fill': 'description',
  'chart.bar.fill': 'bar-chart',
  'calendar': 'event',
  'person.circle.fill': 'account-circle',
  'arrow.right.square.fill': 'logout',
  'chevron.left': 'chevron-left',
  'person.fill': 'person',
  'envelope.fill': 'email',
  'number': 'tag',
  'graduationcap.fill': 'school',
  'text.alignleft': 'format-align-left',
  'person.2.fill': 'group',
  'phone.fill': 'phone',
  'pencil': 'edit',
  'lock.fill': 'lock',
  'percent': 'percent',
  'star.fill': 'star',
  'sun.max': 'wb-sunny',
  'moon': 'brightness-2',
  'iphone': 'phone-iphone',
  'bell.fill': 'notifications',
  'speaker.wave.2.fill': 'volume-up',
  'iphone.radiowaves.left.and.right': 'vibration',
  'arrow.clockwise.circle.fill': 'sync',
  'trash.circle.fill': 'delete',
  'creditcard.fill': 'credit-card',
  'clock.fill': 'alarm',
  'checkmark.circle.fill': 'check-circle',
  'checkmark.circle': 'check-circle-outline',
  'exclamationmark.triangle.fill': 'warning',
  'doc.text': 'description',
  'person': 'person',
  'location': 'location-on',
  'heart.fill': 'favorite',
  'mappin': 'place',
  'map': 'map',
  'globe': 'public',
  'book.fill': 'menu-book',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
