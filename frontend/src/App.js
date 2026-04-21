import { useState } from "react";
import { ethers } from "ethers";

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

  const [file, setFile] = useState(null);
  const [cid, setCid] = useState("");

  // 🔥 NEW STATE (IMPORTANT)
  const [result, setResult] = useState(null);

  // 🔥 Metadata states
  const [caseName, setCaseName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [suspect, setSuspect] = useState("");

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

  // 🔥 Upload file
  const uploadToIPFS = async () => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.cid) throw new Error("CID not received");

      setCid(data.cid);
      return data.cid;

    } catch (err) {
      console.error(err);
      setStatus("❌ File upload failed");
      return null;
    }
  };

  // 🔥 Upload metadata
  const uploadMetadata = async (metadata) => {
    try {
      const res = await fetch("http://localhost:5000/uploadMetadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      });

      const data = await res.json();

      if (!data.metadataCID) throw new Error("Metadata CID not received");

      return data.metadataCID;

    } catch (err) {
      console.error(err);
      setStatus("❌ Metadata upload failed");
      return null;
    }
  };
  
  // 🔥 Add Evidence
  const addEvidence = async () => {
  // 🔥 FIX 1: guard INSIDE function
  if (loading) {
    console.log("⛔ Blocked duplicate click");
    return;
  }

  try {
    console.log("🚀 addEvidence called");

    if (!file) {
      alert("Upload file");
      return;
    }

    if (!caseName || !description || !type || !location || !date || !suspect) {
      alert("Fill all fields");
      return;
    }

    setLoading(true);

    // 1️⃣ Upload file
    const fileCID = await uploadToIPFS();
    if (!fileCID) {
      setLoading(false);
      return;
    }

    // 2️⃣ Create metadata
    const metadata = {
      caseName,
      description,
      type,
      location,
      date,
      suspect,
      fileCID
    };

    // 3️⃣ Upload metadata
    const metadataCID = await uploadMetadata(metadata);
    if (!metadataCID) {
      setLoading(false);
      return;
    }

    // 4️⃣ Generate hash
    const hash = ethers.keccak256(
      ethers.toUtf8Bytes(metadataCID)
    );

    // 5️⃣ Blockchain transaction
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    console.log("⛓ Sending transaction...");
    const tx = await contract.addEvidence(hash);
    await tx.wait();

    // 6️⃣ Save mapping
    await fetch("http://localhost:5000/storeMapping", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        hash,
        metadataCID
      })
    });

    setStatus("✅ Evidence stored successfully");

  } catch (err) {
    console.error(err);
    setStatus("❌ Transaction failed");
  } finally {
    setLoading(false);
  }
};
  // 🔹 Fetch all
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
    setResult(null);
  };

  // 🔥 FIXED: ID → FULL DETAILS
  const getEvidenceById = async () => {
    try {
      if (!searchId) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

      const data = await contract.getEvidence(searchId);
      const hash = data.fileHash;

      // 🔥 FETCH FULL DATA FROM BACKEND
      const res = await fetch(`http://localhost:5000/evidence/${hash}`);
      const resultData = await res.json();

      setResult(resultData);

    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to fetch full evidence");
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>🔐 Blockchain Evidence System</h1>

      <button onClick={connectWallet}>Connect Wallet</button>
      <p><strong>Account:</strong> {account}</p>

      <hr />

      <input placeholder="Case Name" onChange={(e) => setCaseName(e.target.value)} />
      <input placeholder="Description" onChange={(e) => setDescription(e.target.value)} />
      <input placeholder="Type" onChange={(e) => setType(e.target.value)} />
      <input placeholder="Location" onChange={(e) => setLocation(e.target.value)} />
      <input type="date" onChange={(e) => setDate(e.target.value)} />
      <input placeholder="Suspect" onChange={(e) => setSuspect(e.target.value)} />

      <br /><br />

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <br /><br />

      <button
      onClick={addEvidence}
      disabled={loading}
      >
      {loading ? "Processing..." : "Add Evidence"}
      </button>

      <button onClick={fetchAllEvidence}>Fetch All</button>

      <hr />

      {cid && (
        <p>
          CID: {cid} <br />
          <a href={`https://gateway.pinata.cloud/ipfs/${cid}`} target="_blank" rel="noreferrer">
            View File
          </a>
        </p>
      )}

      <hr />

      <h3>🔍 Search by ID</h3>
      <input value={searchId} onChange={(e) => setSearchId(e.target.value)} />
      <button onClick={getEvidenceById}>Get</button>

      <hr />

      {/* 🔥 FULL RESULT DISPLAY */}
      {result && result.metadata && (
  <div>
    <h3>📄 Evidence Details</h3>

    <p><b>Case:</b> {result.metadata.caseName}</p>
    <p><b>Description:</b> {result.metadata.description}</p>
    <p><b>Type:</b> {result.metadata.type}</p>
    <p><b>Location:</b> {result.metadata.location}</p>
    <p><b>Date:</b> {result.metadata.date}</p>
    <p><b>Suspect:</b> {result.metadata.suspect}</p>

    <a
      href={`https://gateway.pinata.cloud/ipfs/${result.metadata.fileCID}`}
      target="_blank"
      rel="noreferrer"
    >
      View Evidence File
    </a>
  </div>
)}
      <hr />

      {evidenceList.map((e) => (
        <div key={e.id}>
          <p>ID: {e.id}</p>
          <p>Hash: {e.hash}</p>
          <p>Owner: {e.owner}</p>
          <p>Timestamp: {e.timestamp}</p>
        </div>
      ))}

      <p>{status}</p>
    </div>
  );
}

export default App;