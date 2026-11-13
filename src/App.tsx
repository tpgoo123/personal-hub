import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import { Home } from './pages/Home'
import { ContentList } from './pages/ContentList'
import { AuthPage } from './pages/AuthPage'
import { Account } from './pages/Account'
import { Admin } from './pages/Admin'
import { About } from './pages/About'
import { PostDetail } from './pages/PostDetail'
import { ResetPassword } from './pages/ResetPassword'
import { NotFound } from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/about" element={<About/>}/>
          <Route path="/projects" element={<ContentList section="projects"/>}/>
          <Route path="/papers" element={<ContentList section="papers"/>}/>
          <Route path="/posts" element={<ContentList section="posts"/>}/>
          <Route path="/life" element={<ContentList section="life"/>}/>
          <Route path="/posts/:id" element={<PostDetail/>}/>
          <Route path="/login" element={<AuthPage mode="login"/>}/>
          <Route path="/register" element={<AuthPage mode="register"/>}/>
          <Route path="/forgot-password" element={<AuthPage mode="forgot"/>}/>
          <Route path="/reset-password" element={<ResetPassword/>}/>
          <Route path="/account" element={<ProtectedRoute><Account/></ProtectedRoute>}/>
          <Route path="/admin" element={<AdminRoute><Admin/></AdminRoute>}/>
          <Route path="*" element={<NotFound/>}/>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
