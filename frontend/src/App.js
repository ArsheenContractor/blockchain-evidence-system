import { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";

const CONTRACT_ADDRESS = "0xB3969ec127aC5837e7336ed9611d490714c61F9A";

const ABI = [
  "function addEvidence(bytes32 _hash) public",
  "function evidenceCount() public view returns (uint256)",
  "function getEvidence(uint256) public view returns (bytes32 fileHash, address owner, uint256 timestamp)"
];

function App() {
  const [account, setAccount] = useState("");
  const [status, setStatus] = useState("");
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchId, setSearchId] = useState("");
  const [singleEvidence, setSingleEvidence] = useState(null);

  const [file, setFile] = useState(null);
  const [cid, setCid] = useState("");

  // 🔹 Connect Wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not installed");
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setAccount(accounts[0]);
  };

  // 🔹 Upload to IPFS
  const uploadToIPFS = async () => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            pinata_api_key: "",
            pinata_secret_api_key: "",
          },
        }
      );

      const uploadedCID = res.data.IpfsHash;
      setCid(uploadedCID);

      return uploadedCID;
    } catch (err) {
      console.error(err);
      setStatus("❌ IPFS upload failed");
    }
  };

  // 🔥 UPDATED — Add Evidence (IPFS + Blockchain)
  const addEvidence = async () => {
    try {
      if (!file) {
        alert("Upload a file first");
        return;
      }

      setLoading(true);
      setStatus("📤 Uploading to IPFS...");

      const uploadedCID = await uploadToIPFS();

      setStatus("🔐 Generating hash...");

      const hash = ethers.keccak256(
        ethers.toUtf8Bytes(uploadedCID)
      );

      setStatus("⛓ Storing on blockchain...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const tx = await contract.addEvidence(hash);
      await tx.wait();

      setStatus("✅ Evidence stored successfully");

    } catch (err) {
      console.error(err);
      setStatus("❌ Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch ALL Evidence
  const fetchAllEvidence = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    const count = await contract.evidenceCount();

    let list = [];

    for (let i = 1; i <= count; i++) {
      const e = await contract.getEvidence(i);

      list.push({
        id: i,
        hash: e.fileHash,
        owner: e.owner,
        timestamp: e.timestamp.toString(),
      });
    }

    setEvidenceList(list);
    setSingleEvidence(null);
  };

  // 🔹 Fetch by ID
  const getEvidenceById = async () => {
    try {
      if (!searchId) {
        alert("Enter ID");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

      const data = await contract.getEvidence(searchId);

      setSingleEvidence({
        id: searchId,
        hash: data.fileHash,
        owner: data.owner,
        timestamp: data.timestamp.toString(),
      });

      setEvidenceList([]);
    } catch (err) {
      console.error(err);
      alert("Invalid ID");
    }
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>🔐 Blockchain Evidence System</h1>

      <button onClick={connectWallet}>Connect Wallet</button>
      <p><strong>Account:</strong> {account}</p>

      <hr />

      {/* 🔥 FILE UPLOAD */}
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />

      <button onClick={addEvidence} disabled={loading}>
        {loading ? "Processing..." : "Upload & Store Evidence"}
      </button>

      <button onClick={fetchAllEvidence} style={{ marginLeft: "10px" }}>
        Fetch All Evidence
      </button>

      {/* 🔥 CID DISPLAY */}
      {cid && (
        <p>
          📌 CID: {cid} <br />
          🔗 <a
            href={`https://gateway.pinata.cloud/ipfs/${cid}`}
            target="_blank"
            rel="noreferrer"
          >
            View File
          </a>
        </p>
      )}

      <hr />

      {/* SEARCH */}
      <h3>🔍 Search by ID</h3>

      <input
        type="number"
        placeholder="Enter Evidence ID"
        value={searchId}
        onChange={(e) => setSearchId(e.target.value)}
      />

      <button onClick={getEvidenceById}>
        Get Evidence
      </button>

      <hr />

      {/* SINGLE */}
      {singleEvidence && (
        <div>
          <h3>📌 Evidence</h3>
          <p>ID: {singleEvidence.id}</p>
          <p>Hash: {singleEvidence.hash}</p>
          <p>Owner: {singleEvidence.owner}</p>
          <p>Timestamp: {singleEvidence.timestamp}</p>
          <hr />
        </div>
      )}

      {/* ALL */}
      {evidenceList.map((e) => (
        <div key={e.id}>
          <p>ID: {e.id}</p>
          <p>Hash: {e.hash}</p>
          <p>Owner: {e.owner}</p>
          <p>Timestamp: {e.timestamp}</p>
          <hr />
        </div>
      ))}

      <p>{status}</p>
    </div>
  );
}

export default App;