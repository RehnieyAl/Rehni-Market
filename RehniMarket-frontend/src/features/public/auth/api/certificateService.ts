import { api } from "@/api/Client";

export interface UpdateCertificateResponse {
  message: string;
  certificateStatus: string;
}

/**
 * Actualiza el certificado de una empresa RECHAZADA identificándola por
 * correo + contraseña. Flujo independiente del login normal: el endpoint es
 * público y NO devuelve ningún JWT.
 */
export async function updateCompanyCertificate(payload: {
  email: string;
  password: string;
  certificate: File;
}): Promise<UpdateCertificateResponse> {
  const formData = new FormData();
  formData.append("email", payload.email);
  formData.append("password", payload.password);
  formData.append("certificate", payload.certificate);

  const { data } = await api.post<UpdateCertificateResponse>(
    "/company/certificate/update",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return data;
}
