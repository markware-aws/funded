import { Evaluation } from "@/types";

function ScoreBar({ score, label }: { score: number; label: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{score}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-700"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function EvaluationPanel({ evaluation }: { evaluation: Evaluation }) {
  const dims = [
    { key: "problemClarity", label: "Problem Clarity" },
    { key: "originality", label: "Originality" },
    { key: "completenessDeployment", label: "Completeness & Deployment" },
    { key: "commercialViability", label: "Commercial Viability" },
    { key: "presentationQuality", label: "Presentation Quality" },
  ] as const;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">AI Evaluation</h2>
        <div className="text-3xl font-bold text-brand-600">{evaluation.totalScore}</div>
      </div>

      <p className="text-sm text-gray-600 mb-6">{evaluation.summary}</p>

      <div className="space-y-4 mb-6">
        {dims.map(({ key, label }) => (
          <div key={key}>
            <ScoreBar score={evaluation.scores[key].score} label={label} />
            <p className="text-xs text-gray-500 mt-1">{evaluation.scores[key].reasoning}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg bg-green-50 p-3">
          <div className="font-medium text-green-700 mb-1">Strongest Signal</div>
          <div className="text-green-600">{evaluation.strongestSignal}</div>
        </div>
        <div className="rounded-lg bg-orange-50 p-3">
          <div className="font-medium text-orange-700 mb-1">Biggest Gap</div>
          <div className="text-orange-600">{evaluation.biggestGap}</div>
        </div>
      </div>
    </div>
  );
}
