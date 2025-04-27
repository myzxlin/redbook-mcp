import axios from "axios";
import fs from "fs";
import path from "path";

export async function downloadImage(imageUrl) {
  try {
    const response = await axios({
      url: imageUrl,
      method: "GET",
      responseType: "stream",
    });

    const filename = path.basename(imageUrl);
    const localPath = path.join("/tmp", filename);

    const downloadDir = path.dirname(localPath);
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    response.data.pipe(fs.createWriteStream(localPath));

    return new Promise((resolve, reject) => {
      response.data.on("end", () => {
        console.log(`Image downloaded successfully: ${localPath}`);
        resolve(localPath);
      });

      response.data.on("error", (err) => {
        console.error("Error downloading image:", err);
        reject(err);
      });
    });
  } catch (error) {
    console.error("Error downloading image:", error);
    throw error;
  }
}
