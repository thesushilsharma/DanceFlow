import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { DocumentsTable } from "@/components/documents/documents-table"
import { UploadDocumentDialog } from "@/components/documents/upload-document-dialog"
import { getDocuments } from "@/app/actions/documents"

export default async function DocumentsPage() {
  const documents = await getDocuments()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">Manage contracts, waivers, and other documents</p>
        </div>
        <UploadDocumentDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </UploadDocumentDialog>
      </div>

      <DocumentsTable initialDocuments={documents ?? []} />
    </div>
  )
}
