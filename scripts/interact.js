const { ethers } = require("hardhat");

const CONTRACT_ADDRESS = "0xB3969ec127aC5837e7336ed9611d490714c61F9A";

async function main() {

  try {
    const [signer] = await ethers.getSigners();

    console.log("🔹 Signer:", signer.address);

    const contract = await ethers.getContractAt(
      "EvidenceRegistry",
      CONTRACT_ADDRESS
    );

    console.log("✅ Connected to contract");

    // -----------------------------
    // 1. MULTIPLE EVIDENCE (DYNAMIC)
    // -----------------------------
    const base = Date.now();

    const evidences = [
        `FIR-2026-THEFT-${base}`,
        `FORENSIC-REPORT-${base}`
    ];

    let lastHash;

    for (let i = 0; i < evidences.length; i++) {

      const fileHash = ethers.keccak256(
        ethers.toUtf8Bytes(evidences[i])
      );

      lastHash = fileHash;

      console.log(`\n🚀 Adding Evidence ${i + 1}...`);

      const tx = await contract.addEvidence(fileHash, {
        gasLimit: 200000,
      });

      console.log("⏳ Tx Hash:", tx.hash);

      await tx.wait();

      console.log(`✅ Evidence ${i + 1} added`);
    }

    // -----------------------------
    // 2. READ STATE
    // -----------------------------
    const total = await contract.evidenceCount();

    console.log("\n📦 Total Evidence:", total.toString());

    if (total == 0) {
      console.log("⚠️ No evidence found. Exiting...");
      return;
    }

    // -----------------------------
    // 3. FETCH LAST ENTRY
    // -----------------------------
    const evidence = await contract.getEvidence(total);

    console.log("\n📄 Evidence Data:");
    console.log("Hash:", evidence.fileHash);
    console.log("Owner:", evidence.owner);
    console.log("Timestamp:", evidence.timestamp.toString());

    // -----------------------------
    // 4. INTEGRITY CHECK
    // -----------------------------
    if (evidence.fileHash !== lastHash) {
      throw new Error("❌ Hash mismatch — integrity broken");
    }

    console.log("🔐 Integrity verified");

    // -----------------------------
    // 5. OPTIONAL TRANSFER
    // -----------------------------
    const NEW_OWNER = "0x9570D62C5616689F7855562eDBdAAc3b6897863A";

    if (NEW_OWNER !== signer.address) {
      console.log("\n🔄 Transferring ownership...");

      const tx2 = await contract.transferCustody(total, NEW_OWNER);

      console.log("⏳ Transfer Tx:", tx2.hash);

      await tx2.wait();

      console.log("✅ Ownership transferred");
    } else {
      console.log("\n⚠️ Skipping ownership transfer");
    }

  } catch (err) {
    console.error("\n❌ Error:", err.reason || err.message || err);
  }
}

main();