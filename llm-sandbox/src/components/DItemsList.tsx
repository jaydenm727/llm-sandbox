import { useEffect, useState } from "react";
import { getDItems, type DItem } from "../api/dItems";

export default function DItemsList() {
    const [items, setItems] = useState<DItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await getDItems();
                setItems(data);
            } catch (err: any) {
                setError(err.message || "Failed to fetch");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <p>Loading…</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <ul>
            {items.map((it) => (
                <li key={it.id}>
                    <strong>ID:</strong> {it.id}
                    {it.embedding && (
                        <>
                            {" "}
                            <strong>Embedding:</strong> {it.embedding}
                        </>
                    )}
                </li>
            ))}
        </ul>
    );
}
