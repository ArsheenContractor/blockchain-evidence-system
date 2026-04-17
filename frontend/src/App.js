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
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔥 NEW
  const [searchId, setSearchId] = useState("");
  const [singleEvidence, setSingleEvidence] = useState(null);

  // 🔹 Connect Wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask not installed");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setAccount(accounts[0]);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 Add Evidence
  const addEvidence = async () => {
    try {
      if (!input) {
        alert("Enter evidence");
        return;
      }

      setLoading(true);
      setStatus("Sending transaction...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const hash = ethers.keccak256(
        ethers.toUtf8Bytes(input)
      );

      const tx = await contract.addEvidence(hash);
      await tx.wait();

      setStatus("✅ Evidence stored successfully");
      setInput("");
    } catch (err) {
      console.error(err);
      setStatus("❌ Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch ALL Evidence
  const fetchAllEvidence = async () => {
    try {
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
      setSingleEvidence(null); // clear single view
    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 NEW — Fetch by ID
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

      setEvidenceList([]); // clear list view
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

      {/* Add Evidence */}
      <input
        type="text"
        placeholder="Enter Evidence (e.g., FIR-2026)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: "300px", padding: "10px", marginTop: "10px" }}
      />

      <br /><br />

      <button onClick={addEvidence} disabled={loading}>
        {loading ? "Processing..." : "Add Evidence"}
      </button>

      <button onClick={fetchAllEvidence} style={{ marginLeft: "10px" }}>
        Fetch All Evidence
      </button>

      <hr />

      {/* 🔥 NEW: Search by ID */}
      <h3>🔍 Search by ID</h3>

      <input
        type="number"
        placeholder="Enter Evidence ID"
        value={searchId}
        onChange={(e) => setSearchId(e.target.value)}
        style={{ padding: "8px" }}
      />

      <button onClick={getEvidenceById} style={{ marginLeft: "10px" }}>
        Get Evidence by ID
      </button>

      <hr />

      {/* 🔥 Single Evidence View */}
      {singleEvidence && (
        <div>
          <h3>📌 Selected Evidence</h3>
          <p>ID: {singleEvidence.id}</p>
          <p>Hash: {singleEvidence.hash}</p>
          <p>Owner: {singleEvidence.owner}</p>
          <p>Timestamp: {singleEvidence.timestamp}</p>
          <hr />
        </div>
      )}

      {/* 🔥 All Evidence List */}
      {evidenceList.length > 0 && (
        <>
          <h3>📄 All Evidence Records</h3>
          {evidenceList.map((e) => (
            <div key={e.id}>
              <p>ID: {e.id}</p>
              <p>Hash: {e.hash}</p>
              <p>Owner: {e.owner}</p>
              <p>Timestamp: {e.timestamp}</p>
              <hr />
            </div>
          ))}
        </>
      )}

      <p>{status}</p>
    </div>
  );
}

export default App;