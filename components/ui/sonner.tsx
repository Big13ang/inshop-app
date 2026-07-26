"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

/* Toasts are portalled to <body>, outside the safe-area padded app shell, so
   they carry their own inset — otherwise a top-center toast lands under the
   dynamic island and a bottom one under Safari's nav bar. The --app-offset-*
   terms keep them on the visible strip while the keyboard is open. */
const safeAreaOffset = {
  top: 'calc(1rem + var(--safe-top) + var(--app-offset-top))',
  bottom: 'calc(1rem + var(--safe-bottom) + var(--app-offset-bottom))',
  left: 'calc(1rem + var(--safe-left))',
  right: 'calc(1rem + var(--safe-right))',
}

const Toaster = ({ duration = 8000, ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      duration={duration}
      offset={safeAreaOffset}
      mobileOffset={safeAreaOffset}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "#171717",
          "--normal-text": "#ffffff",
          "--normal-border": "rgba(255,255,255,0.08)",
          "--success-bg": "#171717",
          "--success-text": "#ffffff",
          "--success-border": "rgba(255,255,255,0.08)",
          "--warning-bg": "#171717",
          "--warning-text": "#ffffff",
          "--warning-border": "rgba(255,255,255,0.08)",
          "--error-bg": "#171717",
          "--error-text": "#ffffff",
          "--error-border": "rgba(255,255,255,0.08)",
          "--border-radius": "16px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "group toast shadow-lg font-sans",
          icon: "shrink-0",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
