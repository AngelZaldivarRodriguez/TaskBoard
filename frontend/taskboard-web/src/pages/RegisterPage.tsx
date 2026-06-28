import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { authApi } from '../api/authApi'
import { useAuthStore } from '../store/authStore'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

const BoardIcon = () => (
  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z"/>
  </svg>
)

export function RegisterPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      login(data)
      navigate('/')
    },
  })

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-violet-600 flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
            <BoardIcon />
          </div>
          <span className="text-white font-semibold text-lg">TaskBoard</span>
        </div>

        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Empieza gratis.<br />Sin límites.
          </h2>
          <p className="text-violet-200 text-base leading-relaxed">
            Crea tu espacio de trabajo en segundos. Invita a tu equipo y empiecen a mover trabajo juntos.
          </p>
        </div>

        <p className="text-violet-300 text-sm">Sin tarjeta de crédito requerida</p>
      </div>

      <div className="flex-1 flex items-center justify-center bg-zinc-50 p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <BoardIcon />
            </div>
            <span className="font-semibold text-zinc-900 text-lg">TaskBoard</span>
          </div>

          <h1 className="text-2xl font-bold text-zinc-900 mb-1">Crea tu cuenta</h1>
          <p className="text-sm text-zinc-500 mb-8">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-violet-600 font-medium hover:text-violet-700">Inicia sesión</Link>
          </p>

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4">
            <Input label="Nombre" type="text" placeholder="Tu nombre" error={errors.name?.message} {...register('name')} />
            <Input label="Email" type="email" placeholder="tu@email.com" error={errors.email?.message} {...register('email')} />
            <Input label="Contraseña" type="password" placeholder="Mínimo 6 caracteres" error={errors.password?.message} {...register('password')} />

            {mutation.isError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <p className="text-sm text-red-600">El email ya está registrado.</p>
              </div>
            )}

            <Button type="submit" loading={mutation.isPending} className="w-full justify-center mt-1">
              Crear cuenta
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
