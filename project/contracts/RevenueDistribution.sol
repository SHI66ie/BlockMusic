// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMusicNFT {
    function getMusicMetadata(uint256 tokenId) external view returns (
        string memory trackTitle,
        string memory artistName,
        string memory albumName,
        string memory releaseType,
        string memory genre,
        string[] memory samples,
        string memory coverArtURI,
        string memory audioURI,
        uint256 duration,
        uint256 releaseDate,
        address artist,
        uint256 playCount,
        bool isExplicit
    );
    function totalSupply() external view returns (uint256);
}

contract RevenueDistribution is ReentrancyGuard, Ownable {
    // Platform wallet that receives 15% fee
    address public platformWallet;
    
    // MusicNFT contract to read play counts
    address public musicNFTContract;
    
    // USDC token address
    address public usdcToken;
    
    // Revenue pools
    uint256 public totalETHPool;
    uint256 public totalUSDCPool;
    
    // Claimed amounts per artist
    mapping(address => uint256) public claimedETH;
    mapping(address => uint256) public claimedUSDC;
    
    // Last snapshot of total plays (for calculating new revenue distribution)
    uint256 public lastTotalPlays;
    
    // Platform fee percentage (15%)
    uint256 public constant PLATFORM_FEE_PERCENT = 15;
    uint256 public constant ARTIST_POOL_PERCENT = 85;
    
    // Events
    event RevenueReceived(address indexed from, uint256 ethAmount, uint256 usdcAmount);
    event RevenueClaimedETH(address indexed artist, uint256 amount);
    event RevenueClaimedUSDC(address indexed artist, uint256 amount);
    event PlatformFeeWithdrawn(address indexed to, uint256 ethAmount, uint256 usdcAmount);
    event MusicNFTContractUpdated(address indexed newContract);
    
    constructor(
        address _platformWallet,
        address _musicNFTContract,
        address _usdcToken
    ) {
        require(_platformWallet != address(0), "Invalid platform wallet");
        require(_musicNFTContract != address(0), "Invalid NFT contract");
        require(_usdcToken != address(0), "Invalid USDC token");
        
        platformWallet = _platformWallet;
        musicNFTContract = _musicNFTContract;
        usdcToken = _usdcToken;
    }
    
    /**
     * @notice Receive subscription payment and split between platform and artist pool
     * @param usdcAmount Amount of USDC being deposited (must be pre-approved)
     */
    function receiveSubscriptionPayment(uint256 usdcAmount) external payable nonReentrant {
        uint256 ethAmount = msg.value;
        
        require(ethAmount > 0 || usdcAmount > 0, "No payment provided");
        
        // Handle ETH payment
        if (ethAmount > 0) {
            uint256 platformFeeETH = (ethAmount * PLATFORM_FEE_PERCENT) / 100;
            uint256 artistPoolETH = ethAmount - platformFeeETH;
            
            // Send platform fee immediately
            (bool sent, ) = platformWallet.call{value: platformFeeETH}("");
            require(sent, "Failed to send ETH to platform");
            
            // Add to artist pool
            totalETHPool += artistPoolETH;
        }
        
        // Handle USDC payment
        if (usdcAmount > 0) {
            // Transfer USDC from sender
            require(
                IERC20(usdcToken).transferFrom(msg.sender, address(this), usdcAmount),
                "USDC transfer failed"
            );
            
            uint256 platformFeeUSDC = (usdcAmount * PLATFORM_FEE_PERCENT) / 100;
            uint256 artistPoolUSDC = usdcAmount - platformFeeUSDC;
            
            // Send platform fee immediately
            require(
                IERC20(usdcToken).transfer(platformWallet, platformFeeUSDC),
                "Failed to send USDC to platform"
            );
            
            // Add to artist pool
            totalUSDCPool += artistPoolUSDC;
        }
        
        emit RevenueReceived(msg.sender, ethAmount, usdcAmount);
    }
    
    /**
     * @notice Calculate claimable ETH revenue for an artist
     * @param artist Artist address
     * @return claimable Amount of ETH the artist can claim
     */
    function getClaimableETH(address artist) public view returns (uint256 claimable) {
        (uint256 artistPlays, uint256 totalPlays) = getPlayCounts(artist);
        
        if (totalPlays == 0) return 0;
        
        // Calculate artist's share of total pool
        uint256 artistShare = (totalETHPool * artistPlays) / totalPlays;
        
        // Subtract what they've already claimed
        claimable = artistShare > claimedETH[artist] ? artistShare - claimedETH[artist] : 0;
        
        return claimable;
    }
    
    /**
     * @notice Calculate claimable USDC revenue for an artist
     * @param artist Artist address
     * @return claimable Amount of USDC the artist can claim
     */
    function getClaimableUSDC(address artist) public view returns (uint256 claimable) {
        (uint256 artistPlays, uint256 totalPlays) = getPlayCounts(artist);
        
        if (totalPlays == 0) return 0;
        
        // Calculate artist's share of total pool
        uint256 artistShare = (totalUSDCPool * artistPlays) / totalPlays;
        
        // Subtract what they've already claimed
        claimable = artistShare > claimedUSDC[artist] ? artistShare - claimedUSDC[artist] : 0;
        
        return claimable;
    }
    
    /**
     * @notice Get artist's total plays and platform's total plays
     * @param artist Artist address
     * @return artistPlays Total plays for this artist
     * @return totalPlays Total plays across all artists
     */
    function getPlayCounts(address artist) public view returns (uint256 artistPlays, uint256 totalPlays) {
        IMusicNFT nftContract = IMusicNFT(musicNFTContract);
        uint256 supply = nftContract.totalSupply();
        
        artistPlays = 0;
        totalPlays = 0;
        
        for (uint256 i = 0; i < supply; i++) {
            try nftContract.getMusicMetadata(i) returns (
                string memory,
                string memory,
                string memory,
                string memory,
                string memory,
                string[] memory,
                string memory,
                string memory,
                uint256,
                uint256,
                address trackArtist,
                uint256 playCount,
                bool
            ) {
                totalPlays += playCount;
                if (trackArtist == artist) {
                    artistPlays += playCount;
                }
            } catch {
                // Skip if metadata fetch fails
                continue;
            }
        }
        
        return (artistPlays, totalPlays);
    }
    
    /**
     * @notice Claim ETH revenue for the caller (artist)
     */
    function claimETHRevenue() external nonReentrant {
        uint256 claimable = getClaimableETH(msg.sender);
        require(claimable > 0, "No ETH revenue to claim");
        
        claimedETH[msg.sender] += claimable;
        
        (bool sent, ) = msg.sender.call{value: claimable}("");
        require(sent, "Failed to send ETH");
        
        emit RevenueClaimedETH(msg.sender, claimable);
    }
    
    /**
     * @notice Claim USDC revenue for the caller (artist)
     */
    function claimUSDCRevenue() external nonReentrant {
        uint256 claimable = getClaimableUSDC(msg.sender);
        require(claimable > 0, "No USDC revenue to claim");
        
        claimedUSDC[msg.sender] += claimable;
        
        require(
            IERC20(usdcToken).transfer(msg.sender, claimable),
            "Failed to send USDC"
        );
        
        emit RevenueClaimedUSDC(msg.sender, claimable);
    }
    
    /**
     * @notice Claim both ETH and USDC revenue in one transaction
     */
    function claimAllRevenue() external nonReentrant {
        uint256 claimableETH = getClaimableETH(msg.sender);
        uint256 claimableUSDC = getClaimableUSDC(msg.sender);
        
        require(claimableETH > 0 || claimableUSDC > 0, "No revenue to claim");
        
        if (claimableETH > 0) {
            claimedETH[msg.sender] += claimableETH;
            (bool sent, ) = msg.sender.call{value: claimableETH}("");
            require(sent, "Failed to send ETH");
            emit RevenueClaimedETH(msg.sender, claimableETH);
        }
        
        if (claimableUSDC > 0) {
            claimedUSDC[msg.sender] += claimableUSDC;
            require(
                IERC20(usdcToken).transfer(msg.sender, claimableUSDC),
                "Failed to send USDC"
            );
            emit RevenueClaimedUSDC(msg.sender, claimableUSDC);
        }
    }
    
    /**
     * @notice Get artist revenue summary
     * @param artist Artist address
     */
    function getArtistRevenueSummary(address artist) external view returns (
        uint256 claimableETH,
        uint256 claimableUSDC,
        uint256 totalClaimedETH,
        uint256 totalClaimedUSDC,
        uint256 artistPlays,
        uint256 totalPlays
    ) {
        claimableETH = getClaimableETH(artist);
        claimableUSDC = getClaimableUSDC(artist);
        totalClaimedETH = claimedETH[artist];
        totalClaimedUSDC = claimedUSDC[artist];
        (artistPlays, totalPlays) = getPlayCounts(artist);
        
        return (
            claimableETH,
            claimableUSDC,
            totalClaimedETH,
            totalClaimedUSDC,
            artistPlays,
            totalPlays
        );
    }
    
    // Admin functions
    
    /**
     * @notice Update platform wallet address
     */
    function setPlatformWallet(address _platformWallet) external onlyOwner {
        require(_platformWallet != address(0), "Invalid address");
        platformWallet = _platformWallet;
    }
    
    /**
     * @notice Update MusicNFT contract address
     */
    function setMusicNFTContract(address _musicNFTContract) external onlyOwner {
        require(_musicNFTContract != address(0), "Invalid address");
        musicNFTContract = _musicNFTContract;
        emit MusicNFTContractUpdated(_musicNFTContract);
    }
    
    /**
     * @notice Update USDC token address
     */
    function setUSDCToken(address _usdcToken) external onlyOwner {
        require(_usdcToken != address(0), "Invalid address");
        usdcToken = _usdcToken;
    }
    
    /**
     * @notice Receive ETH
     */
    receive() external payable {
        // Accept ETH transfers
    }
}
