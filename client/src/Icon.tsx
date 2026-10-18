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

export function CrownIcon(props: IconProps) {
  return (
    <Base {...props} fill="currentColor" stroke="none">
      <path d="M3 8l4 3 5-6 5 6 4-3-2 10H5L3 8Z" />
      <path d="M5 20h14" stroke="currentColor" strokeWidth={2} fill="none" />
    </Base>
  )
}

export function PencilIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M17 3a2.83 2.83 0 0 1 4 4L7 21l-4 1 1-4Z" />
    </Base>
  )
}

export function ShieldIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 2 4 5v6c0 5 3.4 8.6 8 11 4.6-2.4 8-6 8-11V5Z" />
    </Base>
  )
}

export function FolderPlusIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </Base>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <Base {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </Base>
  )
}

export function UserPlusIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="16" y1="11" x2="22" y2="11" />
    </Base>
  )
}

export function LockIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Base>
  )
}

export function InstagramIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </Base>
  )
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </Base>
  )
}

export function RocketIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 20 4a12.88 12.88 0 0 1-2.12 8.97A22 22 0 0 1 14 15z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </Base>
  )
}

export function BellIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Base>
  )
}

export function BanIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="4.9" y1="4.9" x2="19.1" y2="19.1" />
    </Base>
  )
}

export function SwapIcon(props: IconProps) {
  return (
    <Base {...props}>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </Base>
  )
}

export function UserXIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="17" y1="8" x2="22" y2="13" />
      <line x1="22" y1="8" x2="17" y2="13" />
    </Base>
  )
}

export function MaximizeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </Base>
  )
}

export function MinimizeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <polyline points="4 9 10 9 10 3" />
      <polyline points="20 15 14 15 14 21" />
      <line x1="10" y1="9" x2="3" y2="2" />
      <line x1="14" y1="15" x2="21" y2="22" />
    </Base>
  )
}

export function DownloadIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3v12" />
      <polyline points="7 10 12 15 17 10" />
      <path d="M4 19h16" />
    </Base>
  )
}

export function HelpCircleIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </Base>
  )
}

export function GearIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c0 .68.39 1.3 1 1.51.59.22 1.27.1 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.43.55-.55 1.23-.33 1.82.21.61.83 1 1.51 1H21a2 2 0 0 1 0 4h-.09c-.68 0-1.3.39-1.51 1Z" />
    </Base>
  )
}

export function MonitorIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </Base>
  )
}

export function AppWindowIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="2" y1="9" x2="22" y2="9" />
      <line x1="6" y1="6.5" x2="6.01" y2="6.5" />
      <line x1="9" y1="6.5" x2="9.01" y2="6.5" />
    </Base>
  )
}

export function BrowserTabIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 8h6l1.3-2.5" />
      <line x1="8" y1="8" x2="22" y2="8" />
    </Base>
  )
}

export function Volume2Icon(props: IconProps) {
  return (
    <Base {...props}>
      <polygon points="4 9 8 9 12 5 12 19 8 15 4 15 4 9" />
      <path d="M16 8a5 5 0 0 1 0 8" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </Base>
  )
}

export function RotateCcwIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </Base>
  )
}

export function RotateCwIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 4v5h-5" />
    </Base>
  )
}

export function FlipHorizontalIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3v18" />
      <path d="M16 7l4 0 0 10-4 0" />
      <path d="M8 7l-4 0 0 10 4 0" />
    </Base>
  )
}

export function FlipVerticalIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 12h18" />
      <path d="M7 8l0 -4 10 0 0 4" />
      <path d="M7 16l0 4 10 0 0 -4" />
    </Base>
  )
}

export function ZoomInIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </Base>
  )
}

export function RefreshIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 12a9 9 0 0 1 15.3-6.5L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.3 6.5L3 16" />
      <path d="M3 21v-5h5" />
    </Base>
  )
}

export function GoogleIcon({ size = 20, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" {...rest}>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-2.1 14.1-5.6l-6.5-5.5c-2 1.5-4.6 2.5-7.6 2.5-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.5C40.9 36.6 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  )
}

export function EyeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Base>
  )
}

export function EyeOffIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9.9 5.17A9.6 9.6 0 0 1 12 5c7 0 10.5 7 10.5 7a13.2 13.2 0 0 1-3.38 4.1" />
      <path d="M6.6 6.6C3.4 8.6 1.5 12 1.5 12s3.5 7 10.5 7a9.7 9.7 0 0 0 4.9-1.3" />
      <path d="M9.5 9.5a3 3 0 0 0 4.24 4.24" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </Base>
  )
}
