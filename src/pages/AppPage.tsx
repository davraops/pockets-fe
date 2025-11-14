import './AppPage.css'

interface AppPageProps {
  title?: string
  icon?: React.ReactNode
  color?: string
}

function AppPage({ title, icon, color }: AppPageProps) {
  return (
    <div className="app-page-container">
      <div className="app-page-content">
        <div className="glass-content">
          <p className="app-page-subtitle">
            Blank
          </p>
        </div>
      </div>
    </div>
  )
}

export default AppPage

