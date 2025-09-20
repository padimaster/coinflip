// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

library SignatureVerifier {
    using ECDSA for bytes32;

    bytes32 public constant CLAIM_TYPEHASH =
        keccak256(
            "ClaimData(address userAddress,uint256 flipCount,uint256 minFlipsRequired,uint256 timestamp,uint256 nonce)"
        );

    function verifyClaimSignature(
        address userAddress,
        uint256 flipCount,
        uint256 minFlipsRequired,
        uint256 timestamp,
        uint256 nonce,
        bytes calldata signature,
        address expectedSigner,
        bytes32 domainSeparator
    ) internal pure returns (bool) {
        bytes32 structHash = keccak256(
            abi.encode(
                CLAIM_TYPEHASH,
                userAddress,
                flipCount,
                minFlipsRequired,
                timestamp,
                nonce
            )
        );

        bytes32 hash = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );
        address signer = hash.recover(signature);

        return signer == expectedSigner;
    }

    function getDomainSeparator(
        string memory name,
        string memory version,
        uint256 chainId,
        address verifyingContract
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256(
                        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                    ),
                    keccak256(bytes(name)),
                    keccak256(bytes(version)),
                    chainId,
                    verifyingContract
                )
            );
    }
}
