const stages = ["DESIGN", "TEST", "DEPLOY", "RUN"];

export function StageBar() {
  return (
    <div aria-label="Workflow stages" className="rv-stagebar" data-testid="stage-bar">
      {stages.map((stage, index) => (
        <span className={`rv-stagebar__item ${index === 0 ? "rv-stagebar__item--active" : ""}`} key={stage}>
          {stage}
        </span>
      ))}
    </div>
  );
}
