"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

export function SearchStudents() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSearch = (term: string) => {
    startTransition(() => {
      const params = new URLSearchParams()
      if (term) params.set("q", term)
      router.push(`/dashboard/students?${params.toString()}`)
    })
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search students..." className="pl-9" onChange={(e) => handleSearch(e.target.value)} />
      </div>
    </div>
  )
}
