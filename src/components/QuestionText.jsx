export default function QuestionText({ q }) {
  return (
    <div>
      <div className="question-text">{q.questionText}</div>
      {q.code && (
        <pre className="code-block"><code>{q.code}</code></pre>
      )}
    </div>
  )
}
