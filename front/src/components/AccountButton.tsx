import { UserButton } from '@clerk/clerk-react'

export function AccountButton() {
  return (
    <div className="fixed right-4 top-3 z-40 sm:right-6">
      <UserButton
        appearance={{
          elements: { userButtonAvatarBox: 'h-8 w-8 sm:h-9 sm:w-9' },
        }}
      />
    </div>
  )
}
