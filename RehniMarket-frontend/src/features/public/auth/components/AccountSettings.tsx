/** Configuración de cuenta (todos los roles): perfil del representante (foto, nombre y teléfono), correo de
 * acceso y cambio de contraseña con código. Los datos de la tienda no se editan aquí. */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { Mail, Pencil, Save, ShieldCheck, Upload, User, X } from "lucide-react";

import ConfirmModal from "@/shared/components/ConfirmModal";
import { useAlert } from "@/shared/components/alert/useAlert";
import { useAuth } from "@/features/public/auth/context/useAuth";
import { forgotPassword, updateMe, updateMePhoto } from "@/features/public/auth/api/authService";
import { Button, Input } from "@/shared/components/ui";
import DashboardPageHeader from "@/shared/components/dashboard/DashboardPageHeader";
import { FILE_ACCEPT, validateFile } from "@/shared/validation/files";

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { showAlert } = useAlert();

  const [confirmPasswordOpen, setConfirmPasswordOpen] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [nameForm, setNameForm] = useState(user?.name ?? "");
  const [tellForm, setTellForm] = useState(user?.tell ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [editingEmail, setEditingEmail] = useState(false);
  const [emailForm, setEmailForm] = useState(user?.email ?? "");
  const [savingEmail, setSavingEmail] = useState(false);

  const [sendingCode, setSendingCode] = useState(false);

  const handleStartEditProfile = () => {
    setNameForm(user?.name ?? "");
    setTellForm(user?.tell ?? "");
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    const name = nameForm.trim();
    const tell = tellForm.trim();

    if (name.length < 3) {
      showAlert("error", "El nombre debe tener al menos 3 caracteres.");
      return;
    }

    if (!/^\d{10}$/.test(tell)) {
      showAlert("error", "El teléfono debe tener exactamente 10 dígitos.");
      return;
    }

    try {
      setSavingProfile(true);
      await updateMe({ fullName: name, tell });
      await refreshProfile();
      setEditingProfile(false);
    } catch (error) {
      console.error("Error actualizando el perfil", error);
      showAlert("error", "No se pudo actualizar el perfil. Intenta de nuevo.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSelectPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const error = validateFile(file, "image", "Foto de perfil");
    if (error) {
      e.target.value = "";
      showAlert("error", error);
      return;
    }

    setSelectedPhoto(file);
    setPreviewPhoto(URL.createObjectURL(file));
  };

  const handleUploadPhoto = async () => {
    if (!selectedPhoto) return;

    try {
      setUploadingPhoto(true);
      await updateMePhoto(selectedPhoto);
      await refreshProfile();

      setSelectedPhoto(null);
      setPreviewPhoto(null);
    } catch (error) {
      console.error("Error actualizando la foto de perfil", error);
      showAlert("error", "No se pudo actualizar la foto de perfil. Intenta de nuevo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleStartEditEmail = () => {
    setEmailForm(user?.email ?? "");
    setEditingEmail(true);
  };

  const handleSaveEmail = async () => {
    const trimmed = emailForm.trim();

    if (!trimmed) {
      showAlert("error", "Ingresa un correo electrónico válido.");
      return;
    }

    try {
      setSavingEmail(true);
      await updateMe({ email: trimmed });
      await refreshProfile();
      setEditingEmail(false);
    } catch (error) {
      console.error("Error actualizando el correo", error);
      showAlert("error", "No se pudo actualizar el correo. Es posible que ya esté en uso.");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    try {
      setSendingCode(true);
      await forgotPassword({ email: user.email });
      void navigate("/reset-password", { state: { email: user.email } });
    } catch (error) {
      console.error("Error enviando el código de recuperación", error);
      showAlert("error", "No se pudo enviar el código. Intenta de nuevo más tarde.");
    } finally {
      setSendingCode(false);
      setConfirmPasswordOpen(false);
    }
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="w-full">
      <DashboardPageHeader
        icon={<User size={26} />}
        title="Configuración de cuenta"
        description="Administra tu información personal y la seguridad de tu cuenta."
      />

      <SettingsSection
        icon={<User size={20} />}
        title="Perfil"
        description="Tu foto, tu nombre y tu teléfono de contacto."
        action={!editingProfile && <EditButton label="Editar perfil" onClick={handleStartEditProfile} />}
      >
        <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
          <div className="flex flex-wrap items-center gap-5 lg:border-r lg:border-hairline lg:pr-8">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-secondary/80 bg-surface-2 p-1">
              {previewPhoto || user?.profileImagen ? (
                <img
                  src={previewPhoto ?? user?.profileImagen ?? undefined}
                  alt={user?.name ?? "Foto de perfil"}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full text-3xl font-semibold text-ink">
                  <span aria-hidden="true">{initial}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex h-11 w-fit cursor-pointer items-center gap-2 rounded-control border border-hairline bg-surface-2 px-4 text-sm font-medium text-ink transition hover:bg-surface-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-secondary">
                <Upload size={16} aria-hidden="true" />
                Cambiar foto
                <input type="file" className="sr-only" accept={FILE_ACCEPT.image} onChange={handleSelectPhoto} />
              </label>

              {selectedPhoto && (
                <Button size="sm" loading={uploadingPhoto} leadingIcon={<Save size={16} />} onClick={handleUploadPhoto}>
                  {uploadingPhoto ? "Guardando…" : "Guardar foto"}
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Input
              label="Nombre"
              value={editingProfile ? nameForm : (user?.name ?? "")}
              disabled={!editingProfile}
              onChange={(e) => setNameForm(e.target.value)}
            />

            <Input
              label="Teléfono"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={editingProfile ? tellForm : (user?.tell ?? "")}
              disabled={!editingProfile}
              onChange={(e) => setTellForm(e.target.value.replace(/\D/g, ""))}
            />
          </div>
        </div>

        {editingProfile && (
          <FormActions saving={savingProfile} onCancel={() => setEditingProfile(false)} onSave={handleSaveProfile} />
        )}
      </SettingsSection>

      <SettingsSection
        icon={<Mail size={20} />}
        title="Cuenta"
        description="El correo con el que inicias sesión."
        action={!editingEmail && <EditButton label="Editar correo" onClick={handleStartEditEmail} />}
      >
        <Input
          label="Correo electrónico"
          type="email"
          value={editingEmail ? emailForm : (user?.email ?? "")}
          disabled={!editingEmail}
          onChange={(e) => setEmailForm(e.target.value)}
        />

        {editingEmail && <FormActions saving={savingEmail} onCancel={() => setEditingEmail(false)} onSave={handleSaveEmail} />}
      </SettingsSection>

      <SettingsSection icon={<ShieldCheck size={20} />} title="Seguridad" description="Cambia tu contraseña verificando tu correo electrónico.">
        <Button
          variant="outline"
          disabled={sendingCode}
          leadingIcon={<ShieldCheck size={18} />}
          onClick={() => setConfirmPasswordOpen(true)}
        >
          {sendingCode ? "Enviando código…" : "Cambiar contraseña"}
        </Button>
      </SettingsSection>

      <ConfirmModal
        isOpen={confirmPasswordOpen}
        title="Cambiar contraseña"
        message={`Te enviaremos un código de verificación a ${user?.email ?? "tu correo"} para crear una nueva contraseña. ¿Continuar?`}
        confirmLabel="Enviar código"
        loading={sendingCode}
        onConfirm={handleChangePassword}
        onClose={() => setConfirmPasswordOpen(false)}
      />
    </div>
  );
}

interface SettingsSectionProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}

function SettingsSection({ icon, title, description, action, children }: SettingsSectionProps) {
  return (
    <section className="mt-6 rounded-card border border-hairline bg-surface-1 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-secondary/15 text-secondary">
            {icon}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-hairline bg-surface-2 text-ink-muted transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      aria-label={label}
    >
      <Pencil size={18} aria-hidden="true" />
    </button>
  );
}

function FormActions({ saving, onCancel, onSave }: { saving: boolean; onCancel: () => void; onSave: () => void }) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <Button variant="outline" disabled={saving} leadingIcon={<X size={18} />} onClick={onCancel}>
        Cancelar
      </Button>
      <Button loading={saving} leadingIcon={<Save size={18} />} onClick={onSave}>
        {saving ? "Guardando…" : "Guardar"}
      </Button>
    </div>
  );
}
