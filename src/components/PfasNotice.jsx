// Spec 9.2. Informational only — it changes nothing about where the submission
// goes, because in this build the submission goes nowhere.
export default function PfasNotice({ text }) {
  if (!text) return null
  return (
    <p
      role="status"
      className="mt-3 rounded-md border-l-2 border-teal bg-teal/5 px-4 py-3 font-body text-sm text-ink/85"
    >
      {text}
    </p>
  )
}
