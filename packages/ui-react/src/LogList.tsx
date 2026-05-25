export interface LogListEntry {
  key: string;
  title: string;
  subtitle?: string;
  timestamp?: string;
  detail?: string;
}

export interface LogListModel {
  title?: string;
  entries: LogListEntry[];
  emptyMessage?: string;
}

export interface LogListProps {
  model: LogListModel;
  className?: string;
}

export function LogList({ model, className }: LogListProps) {
  const classes = ["data-card", className].filter(Boolean).join(" ");

  return (
    <section className={classes}>
      {model.title ? (
        <div className="card-head">
          <h3>{model.title}</h3>
        </div>
      ) : null}
      {model.entries.length === 0 ? (
        <div className="empty-state">
          <p>{model.emptyMessage ?? "No entries yet."}</p>
        </div>
      ) : (
        <ul className="react-log-list">
          {model.entries.map((entry) => (
            <li key={entry.key}>
              <div>
                <strong>{entry.title}</strong>
                {entry.subtitle ? <p>{entry.subtitle}</p> : null}
                {entry.detail ? <small>{entry.detail}</small> : null}
              </div>
              {entry.timestamp ? <time>{entry.timestamp}</time> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
