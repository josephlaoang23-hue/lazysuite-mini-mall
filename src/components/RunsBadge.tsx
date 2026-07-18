interface RunsBadgeProps {
    remainingRuns: number;
  }
  
  export default function RunsBadge({ remainingRuns }: RunsBadgeProps) {
    let variantClass = "runs-badge-safe";
    if (remainingRuns === 0) {
      variantClass = "runs-badge-danger";
    } else if (remainingRuns <= 2) {
      variantClass = "runs-badge-warning";
    }
  
    return (
      <span className={`runs-badge ${variantClass}`}>
        ⚡ {remainingRuns} of 5 daily runs left
      </span>
    );
  }