import clsx from "clsx";

type Props = {
  level: string;
  score?: number;
};

export default function RiskBadge({ level, score }: Props) {
  const upper = (level || "LOW").toUpperCase();
  return (
    <span
      className={clsx(
        "badge",
        upper === "HIGH" && "badge-red",
        upper === "MEDIUM" && "badge-yellow",
        upper === "LOW" && "badge-green"
      )}
    >
      {upper}
      {score !== undefined && ` (${Math.round(score * 100)}%)`}
    </span>
  );
}
