import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Base({ size = 20, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  )
}

export function MicIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </Base>
  )
}

export function MicOffIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 9v3a3 3 0 0 0 4.6 2.55" />
      <path d="M15 5.5V5a3 3 0 0 0-5.9-.7" />
      <path d="M5 10a7 7 0 0 0 9.5 6.57" />
      <path d="M19 10a6.98 6.98 0 0 1-1.2 3.9" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
      <line x1="3" y1="3" x2="21" y2="21" />
    </Base>
  )
}

export function HeadphonesIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="2.5" y="14" width="5" height="7" rx="2" />
      <rect x="16.5" y="14" width="5" height="7" rx="2" />
    </Base>
  )
}

export function HeadphonesOffIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 12.5V12a8 8 0 0 1 13.8-5.6" />
      <path d="M20 14v-2a7.96 7.96 0 0 0-.6-3" />
      <rect x="2.5" y="14" width="5" height="7" rx="2" />
      <rect x="16.5" y="14" width="5" height="7" rx="2" />
      <line x1="3" y1="3" x2="21" y2="21" />
    </Base>
  )
}

export function VideoIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="2" y="6" width="13" height="12" rx="2.5" />
      <path d="M22 9.2v5.6c0 .9-1 1.4-1.7.9l-5.3-3.1v-1.2l5.3-3.1c.7-.5 1.7 0 1.7.9Z" />
    </Base>
  )
}

export function VideoOffIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M15 11.3 20.3 8c.7-.5 1.7 0 1.7.9v6.2c0 .9-1 1.4-1.7.9L15 12.7" />
      <path d="M2 8.5A2.5 2.5 0 0 1 4.5 6H12a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 12 18H4.5A2.5 2.5 0 0 1 2 15.5Z" />
      <line x1="2" y1="3" x2="22" y2="21" />
    </Base>
  )
}

export function ScreenShareIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="2" y="4" width="20" height="13" rx="2.2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <path d="M9 10.5 12.5 7l3 3.5" />
      <line x1="12.5" y1="7" x2="12.5" y2="13.5" />
    </Base>
  )
}

export function ScreenShareOffIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M22 8.5V15a2.2 2.2 0 0 1-2.2 2.2H7" />
      <path d="M4.2 4.2A2.2 2.2 0 0 0 2 6.4V15a2.2 2.2 0 0 0 2.2 2.2h.6" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </Base>
  )
}

export function PhoneIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M21 16.4v2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.2 2 2 0 0 1 3 1h2a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L6 8.8a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.9 2Z" />
    </Base>
  )
}

export function PhoneOffIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M11 5a16 16 0 0 1 6.3 1.7M21 16.4v2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.2 2 2 0 0 1 3 1h2a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L6 8.8a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.9 2Z" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </Base>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Base {...props}>
      <polyline points="6 9 12 15 18 9" />
    </Base>
  )
}

export function UsersIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" />
      <circle cx="9" cy="8" r="3.2" />
      <path d="M17.5 20v-1.5a3.5 3.5 0 0 0-2.3-3.3" />
      <path d="M14.3 4.3a3.2 3.2 0 0 1 0 6.1" />
    </Base>
  )
}

export function MessageCircleIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M21 11.5a8.4 8.4 0 0 1-1 4.1 8.5 8.5 0 0 1-7.6 4.6 8.4 8.4 0 0 1-4.1-1L3 20l.8-5.3a8.4 8.4 0 0 1-1-4.2 8.5 8.5 0 0 1 4.6-7.6 8.4 8.4 0 0 1 4.1-1h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </Base>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </Base>
  )
}

export function XIcon(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Base>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <Base {...props}>
      <polyline points="20 6 9 17 4 12" />
    </Base>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </Base>
  )
}

export function PaperclipIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M21.4 11.1 12.2 20.3a5 5 0 0 1-7.1-7.1l9.2-9.2a3.5 3.5 0 0 1 5 5L10 18.3a2 2 0 0 1-2.8-2.8l8-8" />
    </Base>
  )
}

export function SmileIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </Base>
  )
}

export function SendIcon(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="21" y1="3" x2="10.5" y2="13.5" />
      <path d="M21 3 14.5 21a.6.6 0 0 1-1.1 0L10.5 13.5 3 10.6a.6.6 0 0 1 0-1.1L21 3Z" />
    </Base>
  )
}

export function FileIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <polyline points="14 2 14 8 20 8" />
    </Base>
  )
}
