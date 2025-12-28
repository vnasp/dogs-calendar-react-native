import { supabase } from "./supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

const BUCKET_NAME = "dog-photos";

/**
 * Sube una imagen a Supabase Storage y retorna la URL pública
 * @param uri URI local de la imagen
 * @param userId ID del usuario para organizar las imágenes
 * @returns URL pública de la imagen subida
 */
export async function uploadDogPhoto(
  uri: string,
  userId: string
): Promise<string> {
  try {
    // Leer el archivo como base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64",
    });

    // Generar nombre único para el archivo
    const fileExt = uri.split(".").pop()?.split("?")[0] || "jpg";
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Convertir base64 a ArrayBuffer usando la librería instalada
    const arrayBuffer = decode(base64);

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) throw error;

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading photo:", error);
    throw error;
  }
}

/**
 * Elimina una foto de Supabase Storage
 * @param photoUrl URL pública de la foto a eliminar
 */
export async function deleteDogPhoto(photoUrl: string): Promise<void> {
  try {
    // Extraer el path del archivo desde la URL
    const url = new URL(photoUrl);
    const pathMatch = url.pathname.match(
      /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/
    );

    if (!pathMatch) {
      console.warn("Could not parse photo path from URL:", photoUrl);
      return;
    }

    const filePath = pathMatch[1];

    // Eliminar de Storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting photo:", error);
    // No lanzar error para no bloquear la eliminación del perro
  }
}

/**
 * Reemplaza una foto existente por una nueva
 * @param oldPhotoUrl URL de la foto anterior a eliminar
 * @param newPhotoUri URI local de la nueva foto
 * @param userId ID del usuario
 * @returns URL pública de la nueva foto
 */
export async function replaceDogPhoto(
  oldPhotoUrl: string | undefined,
  newPhotoUri: string,
  userId: string
): Promise<string> {
  // Si hay una foto anterior y es de Supabase, eliminarla
  if (oldPhotoUrl && oldPhotoUrl.includes("supabase")) {
    await deleteDogPhoto(oldPhotoUrl);
  }

  // Subir la nueva foto
  return await uploadDogPhoto(newPhotoUri, userId);
}
