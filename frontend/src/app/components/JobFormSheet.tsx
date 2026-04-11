import { useTranslation } from 'react-i18next'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import AddApplicationForm from '@/app/components/AddApplicationForm'

interface JobFormSheetProps {
  open: boolean
  onClose: () => void
}

export default function JobFormSheet({ open, onClose }: JobFormSheetProps) {
  const { t } = useTranslation()

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('jobs.addTitle')}</SheetTitle>
          <SheetDescription>{t('jobs.addSubtitle')}</SheetDescription>
        </SheetHeader>
        <AddApplicationForm onSuccess={onClose} />
      </SheetContent>
    </Sheet>
  )
}
