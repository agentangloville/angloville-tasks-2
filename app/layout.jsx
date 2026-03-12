import './globals.css'

export const metadata = {
  title: 'Angloville Tasks',
  description: 'Marketing Task Management',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  )
}
