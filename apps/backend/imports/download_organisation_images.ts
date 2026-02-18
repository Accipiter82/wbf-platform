import fs from "fs";
import path from "path";
import axios from "axios";
import csv from "csv-parser";

const seedCsvPath = path.join(__dirname, "organisation_seed.csv");
const imagesDir = path.join(__dirname, "images");

// Example Unsplash URLs for demo purposes
const coverImages = [
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400",
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=400",
    "https://images.unsplash.com/photo-1464983953574-0892a716854b?w=800&h=400",
    "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=800&h=400",
    "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=800&h=400",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=400",
    "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=800&h=400",
    "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=800&h=400",
    "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=800&h=400"
];
const logoImages = [
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200",
    "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=200&h=200",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200",
    "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200&h=200",
    "https://images.unsplash.com/photo-1465101178521-c1a9136a3b43?w=200&h=200",
    "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=200&h=200",
    "https://images.unsplash.com/photo-1465101178521-c1a9136a3b43?w=200&h=200",
    "https://images.unsplash.com/photo-1465101178521-c1a9136a3b43?w=200&h=200",
    "https://images.unsplash.com/photo-1465101178521-c1a9136a3b43?w=200&h=200"
];

async function downloadImage(url: string, filepath: string) {
    const writer = fs.createWriteStream(filepath);
    const response = await axios({ url, method: "GET", responseType: "stream" });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on("finish", () => resolve(true));
        writer.on("error", reject);
    });
}

async function main() {
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }

    const orgs: { name: string }[] = [];

    fs.createReadStream(seedCsvPath)
        .pipe(csv())
        .on("data", (row) => {
            orgs.push({ name: row.name });
        })
        .on("end", async () => {
            for (let i = 0; i < orgs.length; i++) {
                const org = orgs[i];
                const orgFolder = path.join(imagesDir, org.name);
                if (!fs.existsSync(orgFolder)) {
                    fs.mkdirSync(orgFolder, { recursive: true });
                }
                // Download cover
                const coverUrl = coverImages[i % coverImages.length];
                const coverPath = path.join(orgFolder, "cover.jpg");
                if (!fs.existsSync(coverPath)) {
                    console.log(`Downloading cover for ${org.name}...`);
                    await downloadImage(coverUrl, coverPath);
                }
                // Download logo
                const logoUrl = logoImages[i % logoImages.length];
                const logoPath = path.join(orgFolder, "logo.jpg");
                if (!fs.existsSync(logoPath)) {
                    console.log(`Downloading logo for ${org.name}...`);
                    await downloadImage(logoUrl, logoPath);
                }
            }
            console.log("All images downloaded!");
        });
}

main().catch((err) => {
    console.error("Error downloading images:", err);
    process.exit(1);
}); 