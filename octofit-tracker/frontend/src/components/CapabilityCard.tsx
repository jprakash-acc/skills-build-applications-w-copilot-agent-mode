import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props<T extends object> = {
  title: string;
  description: string;
  path: string;
  itemsKey: string;
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
};

export function CapabilityCard<T extends object>({ title, description, path, itemsKey, emptyMessage, renderItem }: Props<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getJson<Record<string, T[]>>(path)
      .then((result) => setItems(result[itemsKey] ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [itemsKey, path]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {loading ? <p role="status">Loading {title.toLowerCase()}...</p> : null}
        {error ? <p role="alert">Unable to load {title.toLowerCase()}.</p> : null}
        {!loading && !error && items.length === 0 ? <p>{emptyMessage}</p> : null}
        {!loading && !error && items.length > 0 ? <ul>{items.map((item, index) => <li key={index}>{renderItem(item)}</li>)}</ul> : null}
      </div>
    </section>
  );
}
