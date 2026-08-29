import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Save, ShieldCheck, Upload, X } from "lucide-react";

import ConfirmModal from "@/shared/components/ConfirmModal";
import { useAlert } from "@/shared/components/alert/useAlert";
import { useAuth } from "@/features/public/auth/context/useAuth";
import { forgotPassword, updateMe, updateMePhoto } from "@/features/public/auth/api/authService";
import { Button, Input } from "@/shared/components/ui";

// Configuración de cuenta, común a cualquier rol: nombre, correo, foto y contraseña son de la cuenta.
// Cada dashboard monta este mismo componente.
export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { showAlert } = useAlert();

  const [confirmPasswordOpen, setConfirmPasswordOpen] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [nameForm, setNameForm] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);

  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [editingEmail, setEditingEmail] = useState(false);
  const [emailForm, setEmailForm] = useState(user?.email ?? "");
  const [savingEmail, setSavingEmail] = useState(false);

  const [sendingCode, setSendingCode] = useState(false);

  const handleStartEditName = () => {
    setNameForm(user?.name ?? "");
    setEditingName(true);
  };

  const handleSaveName = async () => {
    const trimmed = nameForm.trim();

    if (trimmed.length < 3) {
      showAlert("error", "El nombre debe tener al menos 3 caracteres.");
      return;
    }

    try {
      setSavingName(true);
      await updateMe({ fullName: trimmed });
      await refreshProfile();
      setEditingName(false);
    } catch (error) {
      console.error("Error actualizando el nombre", error);
      showAlert("error", "No se pudo actualizar el nombre. Intenta de nuevo.");
    } finally {
      setSavingName(false);
    }
  };

  const handleSelectPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

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

  // Reutiliza el flujo de recuperación de contraseña; no hay endpoint aparte para "cambiar estando logueado".
  const handleChangePassword = async () => {
    if (!user) return;

    try {
      setSendingCode(true);
      await forgotPassword({ email: user.email });
      navigate("/reset-password", { state: { email: user.email } });
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
    <div className="mx-auto w-full max-w-3xl">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración de cuenta</h1>

        <p className="mt-1 text-sm text-gray-500">
          Administra tu información personal y la seguridad de tu cuenta.
        </p>
      </div>

      {/* PERFIL: foto de perfil + nombre */}
      <section className="mt-6 rounded-card border border-gray-200 bg-white p-6 shadow-card sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Perfil</h2>

            <p className="mt-1 text-sm text-gray-500">
              Tu foto y tu nombre, visibles en toda la plataforma.
            </p>
          </div>

          {!editingName && (
            <button
              type="button"
              onClick={handleStartEditName}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-gray-600 transition hover:bg-gray-100"
              aria-label="Editar nombre"
            >
              <Pencil size={18} />
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-5">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-card">
            {previewPhoto || user?.profileImagen ? (
              <img
                src={previewPhoto ?? user?.profileImagen ?? undefined}
                alt={user?.name ?? "Foto de perfil"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-gray-500">
                {initial}
              </div>
            )}
          </div>

          <div>
            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-control border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
              <Upload size={16} />
              Cambiar foto
              <input type="file" hidden accept="image/*" onChange={handleSelectPhoto} />
            </label>

            {selectedPhoto && (
              <Button
                className="mt-2"
                size="sm"
                loading={uploadingPhoto}
                leadingIcon={<Save size={16} />}
                onClick={handleUploadPhoto}
              >
                {uploadingPhoto ? "Guardando…" : "Guardar foto"}
              </Button>
            )}
          </div>
        </div>

        <Input
          className="mt-6"
          label="Nombre"
          value={editingName ? nameForm : (user?.name ?? "")}
          disabled={!editingName}
          onChange={(e) => setNameForm(e.target.value)}
        />

        {editingName && (
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              disabled={savingName}
              leadingIcon={<X size={18} />}
              onClick={() => setEditingName(false)}
            >
              Cancelar
            </Button>

            <Button
              loading={savingName}
              leadingIcon={<Save size={18} />}
              onClick={handleSaveName}
            >
              {savingName ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        )}
      </section>

      {/* CUENTA: correo electrónico */}
      <section className="mt-6 rounded-card border border-gray-200 bg-white p-6 shadow-card sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cuenta</h2>

            <p className="mt-1 text-sm text-gray-500">El correo con el que inicias sesión.</p>
          </div>

          {!editingEmail && (
            <button
              type="button"
              onClick={handleStartEditEmail}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-gray-600 transition hover:bg-gray-100"
              aria-label="Editar correo"
            >
              <Pencil size={18} />
            </button>
          )}
        </div>

        <Input
          className="mt-6"
          label="Correo electrónico"
          type="email"
          value={editingEmail ? emailForm : (user?.email ?? "")}
          disabled={!editingEmail}
          onChange={(e) => setEmailForm(e.target.value)}
        />

        {editingEmail && (
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              disabled={savingEmail}
              leadingIcon={<X size={18} />}
              onClick={() => setEditingEmail(false)}
            >
              Cancelar
            </Button>

            <Button
              loading={savingEmail}
              leadingIcon={<Save size={18} />}
              onClick={handleSaveEmail}
            >
              {savingEmail ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        )}
      </section>

      {/* SEGURIDAD: cambiar contraseña */}
      <section className="mt-6 rounded-card border border-gray-200 bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900">Seguridad</h2>

        <p className="mt-1 text-sm text-gray-500">
          Cambia tu contraseña verificando tu correo electrónico.
        </p>

        <Button
          className="mt-6"
          variant="outline"
          disabled={sendingCode}
          leadingIcon={<ShieldCheck size={18} />}
          onClick={() => setConfirmPasswordOpen(true)}
        >
          {sendingCode ? "Enviando código…" : "Cambiar contraseña"}
        </Button>
      </section>

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
