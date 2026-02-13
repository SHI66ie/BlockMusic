// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract MusicNFT is 
    Initializable,
    ERC721URIStorageUpgradeable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable 
{
    uint256 private _tokenIdCounter;
    
    address public platformWallet;
    address public revenueDistributor;
    
    // Minting fee to prevent spam and generate platform revenue
    uint256 public mintFee;
    
    // Total fees collected
    uint256 public totalFeesCollected;
    
    // Music NFT metadata structure
    struct MusicMetadata {
        string trackTitle;
        string artistName;
        string albumName;
        string releaseType; // "Single", "EP", "Album", "Track"
        string genre;
        string[] samples; // Array of samples used
        string coverArtURI;
        string audioURI;
        uint256 duration; // in seconds
        uint256 releaseDate;
        address artist;
        uint256 playCount;
        bool isExplicit;
    }
    
    // Mapping from token ID to music metadata
    mapping(uint256 => MusicMetadata) public musicMetadata;
    
    // Mapping to track plays per user per track
    mapping(uint256 => mapping(address => uint256)) public userPlays;
    
    // Events
    event MusicMinted(
        uint256 indexed tokenId,
        address indexed artist,
        string trackTitle,
        string artistName,
        string releaseType,
        uint256 mintFee
    );
    event MusicPlayed(uint256 indexed tokenId, address indexed listener);
    event PlayCountIncremented(uint256 indexed tokenId, uint256 plays);
    event MintFeeUpdated(uint256 newFee);
    event RevenueDistributorUpdated(address newDistributor);
    event FeesWithdrawn(address indexed to, uint256 amount);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address _platformWallet) public initializer {
        __ERC721_init("BlockMusic NFT", "BMUSIC");
        __ERC721URIStorage_init();
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        platformWallet = _platformWallet;
        mintFee = 0.001 ether; // Default: ~$2-3 at current ETH prices
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    /**
     * @dev Mint a new music NFT
     */
    function mintMusic(
        string memory trackTitle,
        string memory artistName,
        string memory albumName,
        string memory releaseType,
        string memory genre,
        string[] memory samples,
        string memory coverArtURI,
        string memory audioURI,
        uint256 duration,
        bool isExplicit,
        string memory tokenURI
    ) external payable returns (uint256) {
        require(msg.value >= mintFee, "Insufficient mint fee");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Collect mint fee
        if (mintFee > 0) {
            totalFeesCollected += mintFee;
            
            // Send fee to platform wallet
            (bool sent, ) = platformWallet.call{value: mintFee}("");
            require(sent, "Failed to send mint fee");
            
            // Refund excess payment
            if (msg.value > mintFee) {
                (bool refunded, ) = msg.sender.call{value: msg.value - mintFee}("");
                require(refunded, "Failed to refund excess");
            }
        }
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        musicMetadata[tokenId] = MusicMetadata({
            trackTitle: trackTitle,
            artistName: artistName,
            albumName: albumName,
            releaseType: releaseType,
            genre: genre,
            samples: samples,
            coverArtURI: coverArtURI,
            audioURI: audioURI,
            duration: duration,
            releaseDate: block.timestamp,
            artist: msg.sender,
            playCount: 0,
            isExplicit: isExplicit
        });
        
        // Register track with RevenueDistributor if set
        if (revenueDistributor != address(0)) {
            (bool success, ) = revenueDistributor.call(
                abi.encodeWithSignature("registerTrack(uint256,address)", tokenId, msg.sender)
            );
            // Don't revert if registration fails, just continue
            if (!success) {
                // Could emit an event here for monitoring
            }
        }
        
        emit MusicMinted(tokenId, msg.sender, trackTitle, artistName, releaseType, mintFee);
        
        return tokenId;
    }
    
    /**
     * @dev Record a play and pay artist with platform commission
     */
    function playTrack(uint256 tokenId) external payable nonReentrant {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(msg.value > 0, "Must send payment for play");
        
        MusicMetadata storage metadata = musicMetadata[tokenId];
        metadata.playCount++;
        userPlays[tokenId][msg.sender]++;
        
        // Calculate platform commission (15%) and artist payment (85%)
        uint256 platformFee = (msg.value * 15) / 100;
        uint256 artistPayment = msg.value - platformFee;
        
        // Pay platform
        (bool platformSent, ) = platformWallet.call{value: platformFee}("");
        require(platformSent, "Failed to pay platform");
        
        // Pay artist
        (bool artistSent, ) = metadata.artist.call{value: artistPayment}("");
        require(artistSent, "Failed to pay artist");
        
        emit MusicPlayed(tokenId, msg.sender);
    }
    
    /**
     * @dev Get music metadata
     */
    function getMusicMetadata(uint256 tokenId) external view returns (MusicMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return musicMetadata[tokenId];
    }
    
    /**
     * @dev Get samples for a track
     */
    function getSamples(uint256 tokenId) external view returns (string[] memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return musicMetadata[tokenId].samples;
    }
    
    /**
     * @dev Get total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Update platform wallet (only owner)
     */
    function updatePlatformWallet(address _platformWallet) external onlyOwner {
        platformWallet = _platformWallet;
    }
    
    /**
     * @dev Get artist's total earnings from their tracks
     */
    function getArtistEarnings(address artist) external view returns (uint256 totalPlays, uint256 estimatedEarnings) {
        totalPlays = 0;
        
        // Iterate through all tokens to find artist's tracks
        for (uint256 i = 0; i < _tokenIdCounter; i++) {
            if (musicMetadata[i].artist == artist) {
                totalPlays += musicMetadata[i].playCount;
            }
        }
        
        // Estimate earnings: assuming 0.0001 ETH per play * 85% artist share
        // This is an estimate since actual payments are made per play
        estimatedEarnings = totalPlays * 85 * 10**14 / 100; // 0.000085 ETH per play
        
        return (totalPlays, estimatedEarnings);
    }
    
    /**
     * @dev Get play fee (constant for now, can be made dynamic)
     */
    function getPlayFee() external pure returns (uint256) {
        return 0.0001 ether; // 0.0001 ETH per play
    }
    
    /**
     * @dev Increment play count (for subscription-based plays)
     * Only owner can call this (backend wallet via Cloudflare Worker)
     */
    function incrementPlayCount(uint256 tokenId, uint256 plays) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        musicMetadata[tokenId].playCount += plays;
        emit PlayCountIncremented(tokenId, plays);
    }
    
    /**
     * @dev Get contract version
     */
    function version() external pure returns (string memory) {
        return "2.1.0-upgradeable-revenue";
    }
    
    /**
     * @dev Set revenue distributor address (only owner)
     */
    function setRevenueDistributor(address _revenueDistributor) external onlyOwner {
        revenueDistributor = _revenueDistributor;
        emit RevenueDistributorUpdated(_revenueDistributor);
    }
    
    /**
     * @dev Update mint fee (only owner)
     */
    function setMintFee(uint256 _mintFee) external onlyOwner {
        mintFee = _mintFee;
        emit MintFeeUpdated(_mintFee);
    }
    
    /**
     * @dev Withdraw accumulated fees (only owner)
     * Note: Mint fees are sent immediately to platformWallet,
     * this is for any other accumulated funds
     */
    function withdrawFees(address payable to) external onlyOwner nonReentrant {
        require(to != address(0), "Invalid address");
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool sent, ) = to.call{value: balance}("");
        require(sent, "Withdrawal failed");
        
        emit FeesWithdrawn(to, balance);
    }
    
    /**
     * @dev Get current mint fee
     */
    function getMintFee() external view returns (uint256) {
        return mintFee;
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
