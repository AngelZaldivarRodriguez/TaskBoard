import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { authApi } from '../api/authApi'
import { useAuthStore } from '../store/authStore'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

// Zod: esquema de validación (como FluentValidation en .NET)
const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  // useForm: maneja estado del formulario, validación y errores
  // zodResolver conecta el schema de Zod con react-hook-form
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // useMutation: para operaciones que modifican datos (POST, PUT, DELETE)
  // A diferencia de useQuery, NO ejecuta automáticamente — espera a que llames a mutate()
  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data)        // Guardar en Zustand + localStorage
      navigate('/')      // Redirigir al dashboard
    },
  })

  const onSubmit = (data: FormData) => mutation.mutate(data)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm border border-gray-100">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Iniciar sesión</h1>
        <p className="mb-6 text-sm text-gray-500">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">Regístrate</Link>
        </p>

        {/* handleSubmit valida primero, luego llama a onSubmit solo si todo es válido */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* register() conecta el input con react-hook-form */}
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Contraseña" type="password" error={errors.password?.message} {...register('password')} />

          {mutation.isError && (
            <p className="text-sm text-red-500">Email o contraseña incorrectos.</p>
          )}

          <Button type="submit" loading={mutation.isPending} className="w-full justify-center">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  )
}
