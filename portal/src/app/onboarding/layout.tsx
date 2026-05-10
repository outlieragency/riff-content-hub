/**
 * Onboarding always renders with the LIGHT (cream paper) palette regardless
 * of the user's chosen theme. The CSS variables below override the
 * dark-mode token values for the entire onboarding subtree so text/borders
 * stay readable on the cream background.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen antialiased"
      style={
        {
          // Force light palette — overrides any .dark token values
          '--color-background': '#F5F0E5',
          '--color-foreground': '#1A2418',
          '--color-card': '#FBF7EC',
          '--color-card-foreground': '#1A2418',
          '--color-border': '#E0D7C3',
          '--color-border-soft': '#ECE3CE',
          '--color-text-primary': '#1A2418',
          '--color-text-secondary': '#5A5547',
          '--color-text-muted': '#8A8170',
          '--color-secondary': '#ECE3CE',
          '--color-secondary-foreground': '#1A2418',
          '--color-muted': '#ECE3CE',
          '--color-muted-foreground': '#5A5547',
          '--color-primary': '#09321F',
          '--color-primary-foreground': '#F1ECDF',
          colorScheme: 'light',
          background: '#F5F0E5',
          color: '#1A2418',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}
