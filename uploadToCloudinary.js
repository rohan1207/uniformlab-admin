import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuration ---
// IMPORTANT: For better security, move these credentials to a .env file and load them with a package like dotenv.
cloudinary.config({
  cloud_name: 'dsrlnbc5k',
  api_key: '226881632578541',
  api_secret: 'sygJK8W6204n7kVfORNjri27ruY'
});

const menuDataPath = path.join(__dirname, 'src', 'data', 'Menu_Data.js');
const publicFolderPath = path.join(__dirname, 'public');

// --- Helper Functions ---

/**
 * Uploads a single image to Cloudinary.
 * @param {string} localImagePath - The local path of the image relative to the public folder (e.g., '/IMC001_01.jpeg').
 * @returns {Promise<string|null>} The secure URL from Cloudinary or null if upload fails.
 */
const uploadImage = async (localImagePath) => {
  const cleanImagePath = localImagePath.startsWith('/') ? localImagePath.substring(1) : localImagePath;
  const publicId = path.basename(cleanImagePath, path.extname(cleanImagePath));
  const fullPath = path.join(publicFolderPath, cleanImagePath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  Image not found, skipping: ${fullPath}`);
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(fullPath, {
      public_id: publicId,
      folder: 'viransh-menu-items',
      overwrite: true,
      resource_type: 'image',
      use_filename: true,
      unique_filename: false
    });
    console.log(`✅ Successfully uploaded ${cleanImagePath} to ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Failed to upload ${cleanImagePath}. Full error:`, error);
    return null;
  }
};

/**
 * Processes the entire menu data, uploads images, and updates the file.
 */
const processMenuData = async () => {
  console.log('🚀 Starting image upload and data update process...');

  let menuDataModule;
  try {
    // Use a cache-busting query to ensure we get the latest version of the module.
    // The path must be absolute and use the file:// protocol for dynamic import.
    const fileUrl = `file://${menuDataPath}?v=${Date.now()}`;
    menuDataModule = await import(fileUrl);
  } catch (error) {
    console.error(`❌ Failed to load menu data from ${menuDataPath}. Error:`, error);
    return;
  }

  const menuData = menuDataModule.default;
  let imagesToUpdate = 0;

  for (const category of menuData) {
    for (const item of category.items) {
      if (item.images && Array.isArray(item.images)) {
        const updatedImages = [];
        for (const imageUrl of item.images) {
          if (imageUrl.startsWith('/')) {
            imagesToUpdate++;
            const newUrl = await uploadImage(imageUrl);
            updatedImages.push(newUrl || imageUrl);
          } else {
            updatedImages.push(imageUrl);
          }
        }
        item.images = updatedImages;
      }
    }
  }

  if (imagesToUpdate === 0) {
    console.log('✨ No new local images found to upload. Your data file is already up-to-date.');
    return;
  }

  const updatedFileContent = `const menuData = ${JSON.stringify(menuData, null, 2)};\n\nexport default menuData;\n`;

  try {
    fs.writeFileSync(menuDataPath, updatedFileContent, 'utf8');
    console.log(`
🎉 Successfully updated ${menuDataPath} with new Cloudinary URLs!`);
  } catch (error) {
    console.error(`❌ Failed to write updated menu data to file. Error:`, error);
  }
};

// --- Execute Script ---
(async () => {
  await processMenuData();
})();
