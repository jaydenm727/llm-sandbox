import axiosClient from "./axiosClient";

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
