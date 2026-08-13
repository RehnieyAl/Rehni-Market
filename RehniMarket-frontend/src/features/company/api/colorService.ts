import { api } from "@/api/Client";
import type { ColorResponse } from "../types/response";

export async function getColors() {
const { data } = await api.get<ColorResponse[]>(
"/public/colors",
);

return data;
}
