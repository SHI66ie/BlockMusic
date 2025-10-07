// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MusicNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _tokenIdCounter;
    
    address public platformWallet;
    
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
        string releaseType
    );
    event MusicPlayed(uint256 indexed tokenId, address indexed listener);
    
    constructor(address _platformWallet) ERC721("BlockMusic NFT", "BMUSIC") Ownable(msg.sender) {
        platformWallet = _platformWallet;
    }
    
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
    ) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
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
        
        emit MusicMinted(tokenId, msg.sender, trackTitle, artistName, releaseType);
        
        return tokenId;
    }
    
    /**
     * @dev Record a play and pay artist
     */
    function playTrack(uint256 tokenId) external payable nonReentrant {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(msg.value > 0, "Must send payment for play");
        
        MusicMetadata storage metadata = musicMetadata[tokenId];
        metadata.playCount++;
        userPlays[tokenId][msg.sender]++;
        
        // Pay artist (100% of play fee goes to artist)
        (bool sent, ) = metadata.artist.call{value: msg.value}("");
        require(sent, "Failed to pay artist");
        
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
}
