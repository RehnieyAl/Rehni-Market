import { createContext } from "react";

import type {
  AuthUser,
  LoginRequest,
  RegisterUserRequest,
} from "@/types/auth";

export interface AuthContextType {
  user: AuthUser | null;

  // true solo mientras se restaura la sesión al arrancar la app (leer
  // SecureStore + validar contra GET /auth/me) - ver Fase 3 > AUTH
  // PROVIDER > "NO mostrar Login durante un instante mientras se restaura
  // una sesión válida". No se reutiliza para loading de cada pantalla,
  // cada una maneja el suyo (ver Fase 4 > ESTADOS).
  isLoading: boolean;

  // Derivado de `user` (no de la sola presencia de accessToken): solo es
  // true una vez que /auth/me respondió con éxito - un token guardado
  // pero inválido/expirado (y que el refresh no pudo renovar) nunca debe
  // reportar autenticado.
  //
  // IMPORTANTE: "autenticado" y "autorizado para esta app" son cosas
  // DISTINTAS a propósito (ver Fase > RESTRICCIÓN DE ROLE > punto 7) - una
  // cuenta admin/owner/company/support autenticada con credenciales
  // válidas es `isAuthenticated: true` igual, pero `isUser: false`. Nunca
  // colapsar ambos estados en uno solo.
  isAuthenticated: boolean;

  // El único role permitido en esta app (ver Fase > RESTRICCIÓN DE ROLE).
  // Se deriva de `user.role` (la fuente real es /auth/me, nunca un role
  // cacheado aparte) usando el mismo tipo Role de types/auth.ts, sin
  // duplicar la definición.
  isUser: boolean;

  // Devuelve el perfil recién obtenido de /auth/me para que quien llama
  // (LoginScreen) pueda decidir de inmediato si el role está permitido,
  // sin depender de que el contexto ya se haya re-renderizado.
  login(data: LoginRequest): Promise<AuthUser>;

  // No inicia sesión - el backend exige verificar el correo antes de
  // poder hacer login (ver ErrorCode.EMAIL_NOT_VERIFIED), igual que la
  // web. La pantalla es quien navega a verify-email después de llamar
  // esto.
  register(data: RegisterUserRequest): Promise<void>;

  logout(): Promise<void>;

  // Equivalente a refreshProfile() en la web: vuelve a pedir GET
  // /auth/me y actualiza `user`. Se expone para cuando "Configuración de
  // cuenta" (fuera de esta fase) edite nombre/foto/correo.
  refreshSession(): Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
