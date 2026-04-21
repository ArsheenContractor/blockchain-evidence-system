import express from "express";
import multer from "multer";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import FormData from "form-data";

dotenv.config();

const app = express();
const upload = multer();
const evidenceMap = {};
app.use(cors());
app.use(express.json());

/**
 * 🔹 Upload FILE to IPFS
 */
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("📥 File upload request");

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const data = new FormData();
    data.append("file", req.file.buffer, req.file.originalname);

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      data,
      {
        headers: {
          ...data.getHeaders(),
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
        },
      }
    );

    const cid = response.data.IpfsHash;

    console.log("✅ File uploaded:", cid);

    res.json({ cid });

  } catch (err) {
    console.error("❌ File upload error:", err.response?.data || err.message);
    res.status(500).json({ error: "File upload failed" });
  }
});

/**
 * 🔹 Upload METADATA to IPFS
 */
app.post("/uploadMetadata", async (req, res) => {
  try {
    const metadata = req.body;

    console.log("📦 Metadata received:", metadata);

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      metadata,
      {
        headers: {
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
        },
      }
    );

    const metadataCID = response.data.IpfsHash;

    console.log("✅ Metadata uploaded:", metadataCID);

    res.json({ metadataCID });

  } catch (err) {
    console.error("❌ Metadata upload error:", err.response?.data || err.message);
    res.status(500).json({ error: "Metadata upload failed" });
  }
});

app.post("/storeMapping", (req, res) => {
  const { hash, metadataCID } = req.body;

  evidenceMap[hash] = metadataCID;

  console.log("📌 Mapping saved:", hash, "→", metadataCID);

  res.json({ success: true });
});

app.get("/evidence/:hash", async (req, res) => {
  try {
    const { hash } = req.params;

    const metadataCID = evidenceMap[hash];

    if (!metadataCID) {
      return res.status(404).json({ error: "Not found" });
    }

    const response = await axios.get(
      `https://gateway.pinata.cloud/ipfs/${metadataCID}`
    );

    const metadata = response.data;

    res.json({
      hash,
      metadataCID,
      metadata
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fetch failed" });
  }
});


app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
