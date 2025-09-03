export function extractFirstJsonObject(text: string): any {
    // try ```json ... ```
    const fence = /```(?:json)?\s*([\s\S]*?)\s*```/i.exec(text);
    if (fence) {
        try { return JSON.parse(fence[1]); } catch { }
    }
    // try the longest {...} blob
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
        const candidate = text.slice(first, last + 1);
        try { return JSON.parse(candidate); } catch { }
    }
    // final attempt: find the first balanced object by scanning
    let depth = 0, start = -1;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === "{") { if (depth === 0) start = i; depth++; }
        else if (ch === "}") {
            depth--;
            if (depth === 0 && start !== -1) {
                const cand = text.slice(start, i + 1);
                try { return JSON.parse(cand); } catch { }
                start = -1;
            }
        }
    }
    throw new Error("No valid JSON object found");
}
