
/**
 * SERVICE D'OPTIMISATION D'IMAGES CLIENT-SIDE
 * Réduit la taille des images avant l'upload pour économiser de la bande passante et du stockage.
 */

const MAX_WIDTH = 1080; // Full HD Mobile width
const MAX_HEIGHT = 1920; // Full HD Mobile height
const COMPRESSION_QUALITY = 0.8; // 80% (Excellent compromis poids/qualité)
const OUTPUT_FORMAT = 'image/webp'; // Format moderne et léger

/**
 * Compresse et redimensionne une image
 * @param file Fichier image brut (File)
 * @returns Promise<Blob> Image compressée
 */
export const compressImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // 1. Vérification du type
    if (!file.type.startsWith('image/')) {
      reject(new Error("Le fichier n'est pas une image."));
      return;
    }

    // 2. Création de l'objet Image pour lire les dimensions
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = (e) => reject(e);

    img.onload = () => {
      // 3. Calcul des nouvelles dimensions (Conserver ratio)
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      // 4. Création du Canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error("Impossible de créer le contexte Canvas."));
        return;
      }

      // Amélioration de la qualité du rendu
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 5. Dessin de l'image redimensionnée
      ctx.drawImage(img, 0, 0, width, height);

      // 6. Export en WebP compressé
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log(`Image compressée: ${(file.size / 1024).toFixed(2)}kb -> ${(blob.size / 1024).toFixed(2)}kb`);
            resolve(blob);
          } else {
            reject(new Error("Erreur lors de la compression."));
          }
        },
        OUTPUT_FORMAT,
        COMPRESSION_QUALITY
      );
    };

    reader.readAsDataURL(file);
  });
};
