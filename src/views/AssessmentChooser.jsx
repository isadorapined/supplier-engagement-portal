import DoorChooser from '@/components/DoorChooser'

export default function AssessmentChooser({ onGuided, onUpload, onBack }) {
  return (
    <DoorChooser
      overline="Path B"
      title="Full Assessment"
      lead="The assessment covers seven ESRS-aligned sections and around thirty questions."
      backLabel="Back to the portal"
      onBack={onBack}
      doors={[
        {
          title: 'Fill it in here',
          body: 'Work through the seven sections one at a time and submit when you’re done.',
          warning:
            'Your answers are not saved — set aside enough time to finish in one sitting.',
          action: 'Fill it in here',
          onOpen: onGuided,
        },
        {
          title: 'Download and upload',
          body: 'Download the official template, complete it with your colleagues, and upload it back. Only the official template is accepted.',
          action: 'Download and upload',
          onOpen: onUpload,
        },
      ]}
    />
  )
}
