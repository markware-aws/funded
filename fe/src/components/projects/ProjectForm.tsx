import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { CreateProjectInput, Project } from "@/types";
import { PROJECT_CATEGORIES, PROJECT_STATUSES } from "@/lib/constants";

interface Props {
  initial?: Partial<Project>;
  onSubmit: (data: CreateProjectInput) => Promise<void>;
  onSaveDraft?: (data: CreateProjectInput) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
}

export function ProjectForm({
  initial,
  onSubmit,
  onSaveDraft,
  submitLabel = "Submit for Review",
  onCancel,
}: Props) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    tagline: initial?.tagline ?? "",
    description: initial?.description ?? "",
    vision: initial?.vision ?? "",
    features: initial?.features?.join("\n") ?? "",
    websiteUrl: initial?.websiteUrl ?? "",
    githubUrl: initial?.githubUrl ?? "",
    contactEmail: initial?.contactEmail ?? "",
    contactNote: initial?.contactNote ?? "",
    category: initial?.category ?? "saas",
    status: initial?.status ?? "idea",
    screenshotUrl: initial?.screenshotUrl ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pendingAction = useRef<"draft" | "submit">("submit");

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const buildInput = (): CreateProjectInput => ({
    ...form,
    features: form.features.split("\n").filter((f) => f.trim()),
  } as CreateProjectInput);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (pendingAction.current === "draft" && onSaveDraft) {
        await onSaveDraft(buildInput());
      } else {
        await onSubmit(buildInput());
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const field =
    "w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        <h2 className="text-xl font-bold mb-6 text-gray-800">
          Basic Information
        </h2>
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Project Name *
              </label>
              <input
                className={field}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Athena AI"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Category *
              </label>
              <select
                className={field}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                required
              >
                {PROJECT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Tagline *{" "}
              <span className="text-gray-400 font-normal">
                (≤160 chars, shown in cards)
              </span>
            </label>
            <input
              className={field}
              maxLength={160}
              value={form.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              placeholder="A brief, compelling description of what your project does"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This will appear in the project card preview
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Description *
            </label>
            <textarea
              className={`${field} resize-none`}
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="A more detailed description of your project"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Vision Statement *
            </label>
            <textarea
              className={`${field} resize-none`}
              rows={4}
              value={form.vision}
              onChange={(e) => set("vision", e.target.value)}
              placeholder="Describe the long-term vision and impact you want to create"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Stage *
              </label>
              <select
                className={field}
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                required
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Contact Note{" "}
                <span className="text-gray-400 font-normal">
                  (e.g. "open to acquisition")
                </span>
              </label>
              <input
                className={field}
                value={form.contactNote}
                onChange={(e) => set("contactNote", e.target.value)}
                placeholder="open to acquisition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Screenshot */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        <h2 className="text-xl font-bold mb-2 text-gray-800">Screenshot</h2>
        <p className="text-sm text-gray-600 mb-6">
          Add a screenshot or demo image URL to showcase your project |
          Imgur/Cloudinary/GitHub
        </p>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Image URL
          </label>
          <input
            type="url"
            className={`${field} font-mono`}
            value={form.screenshotUrl}
            onChange={(e) => set("screenshotUrl", e.target.value)}
            placeholder="https://example.com/screenshot.png"
          />

          {form.screenshotUrl ? (
            <div className="mt-4 relative">
              <img
                src={form.screenshotUrl}
                alt="Preview"
                className="w-full rounded-xl border border-gray-200"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <button
                type="button"
                onClick={() => set("screenshotUrl", "")}
                className="absolute top-2 right-2 p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          ) : (
            <div className="mt-4 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Paste an image URL above to preview
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Key Features</h2>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Features (one per line) *
          </label>
          <textarea
            className={`${field} font-mono resize-none`}
            rows={8}
            value={form.features}
            onChange={(e) => set("features", e.target.value)}
            placeholder={
              "Natural language processing in Greek\nIntegration with popular CRM systems\nAutomated ticket routing"
            }
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            List the main features or capabilities of your project
          </p>
        </div>
      </div>

      {/* Links & Contact */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        <h2 className="text-xl font-bold mb-6 text-gray-800">
          Links & Contact
        </h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Website URL *
            </label>
            <input
              type="url"
              className={`${field} font-mono`}
              value={form.websiteUrl}
              onChange={(e) => set("websiteUrl", e.target.value)}
              placeholder="https://myproject.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              GitHub Repository
            </label>
            <input
              type="url"
              className={`${field} font-mono`}
              value={form.githubUrl}
              onChange={(e) => set("githubUrl", e.target.value)}
              placeholder="https://github.com/username/repo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Contact Email *
            </label>
            <input
              type="email"
              className={`${field} font-mono`}
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 px-1">{error}</p>}

      {/* Actions */}
      <div className="flex gap-4 pb-4">
        {onSaveDraft && (
          <button
            type="submit"
            disabled={loading}
            onClick={() => { pendingAction.current = "draft"; }}
            className="px-8 py-4 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition font-medium text-gray-700 disabled:opacity-50"
          >
            {loading && pendingAction.current === "draft" ? "Saving…" : "Save Draft"}
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          onClick={() => { pendingAction.current = "submit"; }}
          className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
        >
          {loading && pendingAction.current === "submit" ? "Submitting…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
