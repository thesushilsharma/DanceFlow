import { getStudents } from "@/app/actions/students"

export default async function StudentsPage() {
  const students = await getStudents()
  console.log(students)

  return (
    <div className="p-6 space-y-6">
      Dance Flow Students
    </div>
  )
}
