import Link from "next/link";
import { Heart, Star, Github, ExternalLink, Mail } from "lucide-react";
import { Project } from "@/types";
import { cn } from "@/lib/utils";

const READINESS_COLORS: Record<string, string> = {
  idea: "bg-gray-100 text-gray-600",
  prototype: "bg-yellow-100 text-yellow-700",
  launched: "bg-green-100 text-green-700",
  scalable: "bg-blue-100 text-blue-700",
};

interface Props {
  project: Project;
  onLike?: () => void;
  canLike?: boolean;
}

export function ProjectCard({ project, onLike, canLike }: Props) {
  const label = project.evaluation?.readinessLabel ?? project.status;

  return (
    <div className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all hover:border-blue-200">
      {project.screenshotUrl && (
        <div className="w-full h-48 bg-gray-100 overflow-hidden">
          <img
            src={project.screenshotUrl}
            alt={project.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </div>
      )}
      <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", READINESS_COLORS[label] ?? READINESS_COLORS.idea)}>
              {label}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
              {project.category}
            </span>
          </div>
          <Link href={`/projects/${project.slug}`}>
            <h3 className="font-bold text-xl tracking-tight text-gray-900 hover:text-blue-600 transition truncate">
              {project.name}
            </h3>
          </Link>
          <p className="text-gray-600 text-sm mt-1 leading-relaxed line-clamp-2">{project.tagline}</p>
        </div>

        <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
          {project.evaluation && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-full text-sm font-semibold font-mono border border-green-100">
              <span className="text-base font-bold">{project.evaluation.totalScore}</span>
              <span className="text-xs">/ 100</span>
            </div>
          )}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLike?.(); }}
            disabled={!canLike}
            title={canLike ? undefined : "Submit your own project to like others"}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-full text-sm transition",
              project.likedByMe ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              !canLike && "opacity-50 cursor-not-allowed"
            )}
          >
            <Heart className={cn("w-4 h-4", project.likedByMe && "fill-current")} />
            {project.likeCount}
          </button>
        </div>
      </div>

      {project.vision && (
        <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <p className="text-xs font-semibold text-blue-900 mb-1 uppercase tracking-wide">Vision</p>
          <p className="text-sm text-blue-800 leading-relaxed line-clamp-2">{project.vision}</p>
        </div>
      )}

      {project.features.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">Key Features</p>
          <ul className="space-y-1.5">
            {project.features.slice(0, 3).map((f, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-blue-600 mt-0.5 font-bold">·</span>
                <span className="leading-relaxed">{f}</span>
              </li>
            ))}
            {project.features.length > 3 && (
              <li className="text-xs text-gray-500 font-medium font-mono">
                + {project.features.length - 3} more features
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium shadow-sm"
          >
            <Github className="w-4 h-4" />
            <span className="font-mono">{project.githubStars ?? 0}</span>
            <Star className="w-3 h-3 fill-current" />
          </a>
        )}
        {project.websiteUrl && (
          <a
            href={project.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Visit Project
          </a>
        )}
        <a
          href={`mailto:${project.contactEmail}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition text-sm font-medium"
        >
          <Mail className="w-4 h-4" />
          Contact
        </a>
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t">
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5">{project.category}</span>
        <span className="font-mono">{new Date(project.createdAt).toLocaleDateString("el-GR")}</span>
      </div>
      </div>
    </div>
  );
}
