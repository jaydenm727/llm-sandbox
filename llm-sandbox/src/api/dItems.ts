import axiosClient from "./axiosClient";

export type DItem = {
    id: number;
    embedding?: string; // embedding is text if you cast in Express
};

export async function getDItems(): Promise<DItem[]> {
    const { data } = await axiosClient.get<DItem[]>("/d_items");
    return data;
}

export async function createDItem(embedding: number[]) {
    // You'll need a POST endpoint in Express for this
    const { data } = await axiosClient.post("/d_items", { embedding });
    return data;
}
