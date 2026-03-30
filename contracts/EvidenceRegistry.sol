// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract EvidenceRegistry {

    struct Evidence {
        bytes32 fileHash;
        address owner;
        uint256 timestamp;
    }

    uint256 public evidenceCount;

    mapping(uint256 => Evidence) public evidences;

    event EvidenceAdded(
        uint256 indexed evidenceId,
        bytes32 fileHash,
        address owner,
        uint256 timestamp
    );

    event CustodyTransferred(
        uint256 indexed evidenceId,
        address indexed oldOwner,
        address indexed newOwner
    );

    function addEvidence(bytes32 _fileHash) public {

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

    function transferCustody(
        uint256 _evidenceId,
        address _newOwner
    ) public {

        require(
            evidences[_evidenceId].owner == msg.sender,
            "Not owner"
        );

        address oldOwner = evidences[_evidenceId].owner;

        evidences[_evidenceId].owner = _newOwner;

        emit CustodyTransferred(
            _evidenceId,
            oldOwner,
            _newOwner
        );
    }

    function getEvidence(uint256 _evidenceId)
        public
        view
        returns (
            bytes32,
            address,
            uint256
        )
    {
        Evidence memory e = evidences[_evidenceId];

        return (
            e.fileHash,
            e.owner,
            e.timestamp
        );
    }
}
