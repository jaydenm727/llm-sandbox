import axiosClient from "./axiosClient";
import type { QuerySpec } from "../types/querySpec";

export type DRealtime = {
    rowid: number;
    datasource: string;
    stationid: string;
    sampledate: Date;
    parameter: string;
    resultvalue: number;
};

export async function getDItems(): Promise<DRealtime[]> {
    const { data } = await axiosClient.get<DRealtime[]>("/d_realtime");
    return data;
}

export async function queryRealtime(spec: QuerySpec) {
    const { data } = await axiosClient.post("/d_realtime/query", spec);
    return data as any[]; // you can refine typing based on group_by/ops
}