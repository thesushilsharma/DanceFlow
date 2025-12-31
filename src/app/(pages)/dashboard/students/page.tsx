import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { StudentTable } from "@/components/students/student-table"
import { AddStudentDialog } from "@/components/students/add-student-dialog"
import { getStudents } from "@/app/actions/students"
import { SearchStudents } from "@/components/students/search-students"

export default async function StudentsPage() {
  const students = await getStudents()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-1">Manage your dance studio students</p>
        </div>
        <AddStudentDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </AddStudentDialog>
      </div>

      <SearchStudents />

      <StudentTable students={students} />
    </div>
  )
}
