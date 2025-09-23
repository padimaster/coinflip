// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

library SignatureVerifier {
    /**
     * @dev Generates the domain separator for EIP-712
     */
    function getDomainSeparator(
        string memory name,
        string memory version,
        uint256 chainId,
        address verifyingContract
    ) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(name)),
                keccak256(bytes(version)),
                chainId,
                verifyingContract
            )
        );
    }

    /**
     * @dev Verifies a claim signature for both EOA and smart wallets
     * @param userAddress The user's address
     * @param flipCount The number of flips performed
     * @param minFlipsRequired The minimum flips required
     * @param timestamp The timestamp when the claim was generated
     * @param nonce The user's nonce
     * @param signature The signature to verify
     * @param expectedSigner The expected signer address (should match userAddress)
     * @param domainSeparator The EIP-712 domain separator
     * @return bool Whether the signature is valid
     */
    function verifyClaimSignature(
        address userAddress,
        uint256 flipCount,
        uint256 minFlipsRequired,
        uint256 timestamp,
        uint256 nonce,
        bytes memory signature,
        address expectedSigner,
        bytes32 domainSeparator
    ) internal view returns (bool) {
        // Create the message hash (same structure as your EIP-712 types)
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("ClaimData(address userAddress,uint256 flipCount,uint256 minFlipsRequired,uint256 timestamp,uint256 nonce)"),
                userAddress,
                flipCount,
                minFlipsRequired,
                timestamp,
                nonce
            )
        );

        // Create the final EIP-712 hash
        bytes32 finalHash = MessageHashUtils.toTypedDataHash(domainSeparator, structHash);

        // Use SignatureChecker to verify (works for both EOA and smart wallets)
        return SignatureChecker.isValidSignatureNow(
            expectedSigner,
            finalHash,
            signature
        );
    }

    /**
     * @dev Alternative method using raw message hash (if you prefer simpler hashing)
     */
    function verifyClaimSignatureSimple(
        address userAddress,
        uint256 flipCount,
        uint256 minFlipsRequired,
        uint256 timestamp,
        uint256 nonce,
        bytes memory signature,
        address expectedSigner,
        bytes32 domainSeparator
    ) internal view returns (bool) {
        // Simple message hash
        bytes32 messageHash = keccak256(abi.encodePacked(
            userAddress,
            flipCount,
            minFlipsRequired,
            timestamp,
            nonce
        ));

        // Combine with domain separator
        bytes32 finalHash = keccak256(abi.encodePacked(
            "\x19\x01",
            domainSeparator,
            messageHash
        ));

        // Use SignatureChecker to verify
        return SignatureChecker.isValidSignatureNow(
            expectedSigner,
            finalHash,
            signature
        );
    }
}