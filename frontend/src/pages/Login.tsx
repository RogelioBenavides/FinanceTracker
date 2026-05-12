import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.tsx'
import { api } from '../api/client.ts'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 w-full max-w-sm text-center">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Finance Tracker</h1>
          <p className="text-sm text-gray-400 mt-1">Personal budget management</p>
        </div>
        <GoogleLogin
          onSuccess={async ({ credential }) => {
            try {
              const result = await api.auth.google(credential!)
              login(result.access_token, result.user)
              navigate('/', { replace: true })
            } catch (err) {
              console.error('Sign-in failed:', err)
            }
          }}
          onError={() => console.error('Google sign-in failed')}
          useOneTap
          width="100%"
        />
      </div>
    </div>
  )
}
