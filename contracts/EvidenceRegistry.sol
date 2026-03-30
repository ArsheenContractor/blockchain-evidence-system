// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EvidenceRegistry {

    struct Evidence {
        bytes32 fileHash;
        address owner;
        uint256 timestamp;
    }

    uint256 public evidenceCount;

    mapping(uint256 => Evidence) private evidences;

    // 🔹 EVENTS (Audit trail)
    event EvidenceAdded(
        uint256 indexed evidenceId,
        bytes32 indexed fileHash,
        address indexed owner,
        uint256 timestamp
    );

    event CustodyTransferred(
        uint256 indexed evidenceId,
        address indexed oldOwner,
        address indexed newOwner
    );

    // 🔹 ADD EVIDENCE
    function addEvidence(bytes32 _fileHash) external {

        require(_fileHash != bytes32(0), "Invalid hash");

        evidenceCount++;

        evidences[evidenceCount] = Evidence({
            fileHash: _fileHash,
            owner: msg.sender,
            timestamp: block.timestamp
        });

        emit EvidenceAdded(
            evidenceCount,
            _fileHash,
            msg.sender,
            block.timestamp
        );
    }

    // 🔹 TRANSFER CUSTODY
    function transferCustody(
        uint256 _evidenceId,
        address _newOwner
    ) external {

        require(_evidenceId > 0 && _evidenceId <= evidenceCount, "Invalid evidence ID");

        Evidence storage evidence = evidences[_evidenceId];

        require(msg.sender == evidence.owner, "Not evidence owner");
        require(_newOwner != address(0), "Invalid new owner");

        address oldOwner = evidence.owner;
        evidence.owner = _newOwner;

        emit CustodyTransferred(
            _evidenceId,
            oldOwner,
            _newOwner
        );
    }

    // 🔹 GET EVIDENCE DETAILS
    function getEvidence(uint256 _evidenceId)
        external
        view
        returns (
            bytes32 fileHash,
            address owner,
            uint256 timestamp
        )
    {
        require(_evidenceId > 0 && _evidenceId <= evidenceCount, "Invalid evidence ID");

        Evidence memory e = evidences[_evidenceId];

        return (e.fileHash, e.owner, e.timestamp);
    }
}

