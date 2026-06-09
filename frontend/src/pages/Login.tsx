import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { FiTrendingUp } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth.tsx'
import { api } from '../api/client.ts'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm">
        {/* ambient glow */}
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-emerald-400/30 via-transparent to-sky-500/30 blur-xl" aria-hidden="true" />

        <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl shadow-black/40 p-10 text-center">
          <div className="mb-8 flex flex-col items-center">
            <span className="grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 text-slate-950 shadow-lg shadow-emerald-500/25 mb-4">
              <FiTrendingUp size={26} strokeWidth={2.5} aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Finance<span className="text-emerald-400">Tracker</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1.5">Personal budget management</p>
          </div>

          <div className="flex justify-center [color-scheme:light]">
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
              theme="filled_black"
              shape="pill"
              width="280"
            />
          </div>

          <p className="text-[11px] text-slate-600 mt-8">Secure sign-in with Google</p>
        </div>
      </div>
    </div>
  )
}
