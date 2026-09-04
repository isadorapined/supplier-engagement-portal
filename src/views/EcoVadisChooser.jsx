import DoorChooser from '@/components/DoorChooser'

export default function EcoVadisChooser({ onUpload, onForm, onBack }) {
  return (
    <DoorChooser
      overline="Path A"
      title="EcoVadis Scorecard"
      lead="Your scorecard must have been issued within the last 12 months to be accepted in place of the full questionnaire."
      backLabel="Back to the portal"
      onBack={onBack}
      doors={[
        {
          title: 'Upload your scorecard',
          body: 'Attach your EcoVadis scorecard and confirm the headline details.',
          action: 'Upload your scorecard',
          onOpen: onUpload,
        },
        {
          title: 'Enter your scorecard details',
          body: 'Answer nine questions about your most recent EcoVadis cycle.',
          action: 'Enter your scorecard details',
          onOpen: onForm,
        },
      ]}
    />
  )
}
