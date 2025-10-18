import './App.css'
import { ThemeProvider } from "@/components/theme-provider"
import AuthForm from './components/AuthForm.tsx'
import { ModeToggle } from './components/mode-toggle.tsx'

function App() {
  return (
    <>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <div className='w-full'>
            <div className="relative min-h-screen flex items-center justify-center"> 
              <div className="absolute top-4 right-4 z-50">
                <ModeToggle/>
              </div>
              <AuthForm/> 
            </div>
        </div>
      </ThemeProvider>
    </>
  )
}

export default App
