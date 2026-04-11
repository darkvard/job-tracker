import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import ApplicationDetail from '@/app/components/ApplicationDetail'

interface JobDetailSheetProps {
  jobId: number | null
  open: boolean
  onClose: () => void
}

export default function JobDetailSheet({ jobId, open, onClose }: JobDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="sr-only">Job Detail</SheetTitle>
          <SheetDescription className="sr-only">View and edit job application details</SheetDescription>
        </SheetHeader>
        {jobId !== null && (
          <ApplicationDetail jobId={jobId} onClose={onClose} />
        )}
      </SheetContent>
    </Sheet>
  )
}
