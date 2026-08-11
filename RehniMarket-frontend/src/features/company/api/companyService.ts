import { api } from "@/api/Client";
import type {
UpdateProfileRequest,
CompanyMediaUpload,
} from "@/features/company/types/request";

export async function getCompanyHero() {
const { data } = await api.get("/company/dashboard/me");

return data;
}

export async function getMyCompanyProfile() {
const { data } = await api.get("/company/dashboard/my-profile");

return data;
}

export async function updateMyCompanyProfile(
dataProfile: UpdateProfileRequest,
) {
const { data } = await api.patch(
"/company/dashboard/upgrade-my-profile",
dataProfile,
);

return data;
}

export async function patchMediaLogoBanner(
media: CompanyMediaUpload,
) {
const formData = new FormData();

if (media.photo_profile) {
formData.append("photo_profile", media.photo_profile);
}

if (media.banner_profile) {
formData.append("banner_profile", media.banner_profile);
}

const { data } = await api.patch(
"/company/dashboard/patch-media-logo-banner",
formData,
);

return data;
}
