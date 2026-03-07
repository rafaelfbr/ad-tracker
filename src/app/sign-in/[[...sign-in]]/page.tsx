import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-subtle flex items-center justify-center px-4">
      <div className="animate-fade-in">
        <SignIn />
      </div>
    </div>
  )
}
