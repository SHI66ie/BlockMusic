// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RevenueDistributor
 * @dev Manages revenue distribution from subscriptions to artists based on play counts
 * 
 * Key Features:
 * - Tracks subscription revenue
 * - Records plays from subscribers
 * - Distributes revenue monthly to artists based on play counts
 * - Platform takes 20% fee, artists share 80%
 */
contract RevenueDistributor is Ownable, ReentrancyGuard {
    
    // ============ State Variables ============
    
    /// @notice Accumulated subscription revenue for current period
    uint256 public subscriptionRevenue;
    
    /// @notice Total revenue distributed historically
    uint256 public totalDistributed;
    
    /// @notice Platform fee percentage (20%)
    uint256 public constant PLATFORM_FEE = 20;
    
    /// @notice Track play counts for current distribution period
    mapping(uint256 => uint256) public trackPlaysThisPeriod;
    
    /// @notice Pending revenue for each artist
    mapping(address => uint256) public artistPendingRevenue;
    
    /// @notice Total plays recorded this period
    uint256 public totalPlaysThisPeriod;
    
    /// @notice Last time revenue was distributed
    uint256 public lastDistributionTime;
    
    /// @notice Distribution period (30 days)
    uint256 public constant DISTRIBUTION_PERIOD = 30 days;
    
    /// @notice Minimum revenue required for distribution (prevents gas waste)
    uint256 public constant MIN_DISTRIBUTION_AMOUNT = 0.01 ether;
    
    /// @notice Track artist addresses for each token
    mapping(uint256 => address) public trackArtist;
    
    // ============ Events ============
    
    event SubscriptionRevenueAdded(uint256 amount, uint256 timestamp);
    event RevenueDistributed(uint256 totalRevenue, uint256 totalPlays, uint256 platformFee, uint256 artistRevenue);
    event ArtistPaid(address indexed artist, uint256 amount);
    event PlayRecorded(uint256 indexed tokenId, address indexed listener, uint256 timestamp);
    event TrackRegistered(uint256 indexed tokenId, address indexed artist);
    event EmergencyWithdraw(address indexed to, uint256 amount);
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        lastDistributionTime = block.timestamp;
    }
    
    // ============ Core Functions ============
    
    /**
     * @dev Register a track with its artist (called when NFT is minted)
     * @param tokenId The token ID
     * @param artist The artist address
     */
    function registerTrack(uint256 tokenId, address artist) external onlyOwner {
        require(artist != address(0), "Invalid artist address");
        require(trackArtist[tokenId] == address(0), "Track already registered");
        
        trackArtist[tokenId] = artist;
        
        emit TrackRegistered(tokenId, artist);
    }
    
    /**
     * @dev Record a play from a subscriber (called by backend after verifying subscription)
     * @param tokenId The token ID that was played
     * @param listener The address of the listener
     */
    function recordSubscriberPlay(uint256 tokenId, address listener) external onlyOwner {
        require(trackArtist[tokenId] != address(0), "Track not registered");
        
        trackPlaysThisPeriod[tokenId]++;
        totalPlaysThisPeriod++;
        
        emit PlayRecorded(tokenId, listener, block.timestamp);
    }
    
    /**
     * @dev Add subscription revenue to the pool
     * Can be called by subscription contract or manually funded
     */
    function addSubscriptionRevenue() external payable {
        require(msg.value > 0, "No revenue added");
        
        subscriptionRevenue += msg.value;
        
        emit SubscriptionRevenueAdded(msg.value, block.timestamp);
    }
    
    /**
     * @dev Distribute revenue to artists based on play counts
     * Should be called monthly by platform
     * 
     * Gas optimization: This prepares the distribution but actual payments
     * are done via batchPayArtists to save gas
     */
    function distributeRevenue(uint256[] calldata tokenIds) external onlyOwner nonReentrant {
        require(block.timestamp >= lastDistributionTime + DISTRIBUTION_PERIOD, "Too early to distribute");
        require(totalPlaysThisPeriod > 0, "No plays recorded this period");
        require(subscriptionRevenue >= MIN_DISTRIBUTION_AMOUNT, "Insufficient revenue");
        
        // Calculate platform fee
        uint256 platformFee = (subscriptionRevenue * PLATFORM_FEE) / 100;
        uint256 artistRevenue = subscriptionRevenue - platformFee;
        
        // Send platform fee immediately
        (bool platformSent, ) = owner().call{value: platformFee}("");
        require(platformSent, "Platform payment failed");
        
        // Calculate revenue per play
        uint256 revenuePerPlay = artistRevenue / totalPlaysThisPeriod;
        
        // Calculate pending revenue for each artist
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            uint256 plays = trackPlaysThisPeriod[tokenId];
            
            if (plays > 0) {
                address artist = trackArtist[tokenId];
                require(artist != address(0), "Artist not found");
                
                uint256 earnings = plays * revenuePerPlay;
                artistPendingRevenue[artist] += earnings;
                
                // Reset play count for next period
                trackPlaysThisPeriod[tokenId] = 0;
            }
        }
        
        emit RevenueDistributed(subscriptionRevenue, totalPlaysThisPeriod, platformFee, artistRevenue);
        
        // Update state for next period
        totalDistributed += subscriptionRevenue;
        subscriptionRevenue = 0;
        totalPlaysThisPeriod = 0;
        lastDistributionTime = block.timestamp;
    }
    
    /**
     * @dev Batch pay artists to save gas
     * @param artists Array of artist addresses
     * @param amounts Array of amounts to pay each artist
     */
    function batchPayArtists(
        address[] calldata artists,
        uint256[] calldata amounts
    ) external onlyOwner nonReentrant {
        require(artists.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < artists.length; i++) {
            address artist = artists[i];
            uint256 amount = amounts[i];
            
            require(amount <= artistPendingRevenue[artist], "Amount exceeds pending");
            
            if (amount > 0) {
                artistPendingRevenue[artist] -= amount;
                
                (bool sent, ) = artist.call{value: amount}("");
                require(sent, string(abi.encodePacked("Payment to ", artist, " failed")));
                
                emit ArtistPaid(artist, amount);
            }
        }
    }
    
    /**
     * @dev Allow artists to claim their own pending revenue (alternative to batch pay)
     */
    function claimRevenue() external nonReentrant {
        uint256 pending = artistPendingRevenue[msg.sender];
        require(pending > 0, "No pending revenue");
        
        artistPendingRevenue[msg.sender] = 0;
        
        (bool sent, ) = msg.sender.call{value: pending}("");
        require(sent, "Payment failed");
        
        emit ArtistPaid(msg.sender, pending);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get projected revenue for an artist based on current period plays
     * @param artist The artist address
     * @param tokenIds Array of token IDs owned by artist
     * @return projected The projected revenue for current period
     */
    function getProjectedRevenue(
        address artist,
        uint256[] calldata tokenIds
    ) external view returns (uint256 projected) {
        if (totalPlaysThisPeriod == 0 || subscriptionRevenue == 0) {
            return 0;
        }
        
        uint256 platformFee = (subscriptionRevenue * PLATFORM_FEE) / 100;
        uint256 artistRevenue = subscriptionRevenue - platformFee;
        uint256 revenuePerPlay = artistRevenue / totalPlaysThisPeriod;
        
        uint256 artistPlays = 0;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (trackArtist[tokenIds[i]] == artist) {
                artistPlays += trackPlaysThisPeriod[tokenIds[i]];
            }
        }
        
        return artistPlays * revenuePerPlay;
    }
    
    /**
     * @dev Get play count for a specific track this period
     * @param tokenId The token ID
     * @return plays Number of plays
     */
    function getTrackPlays(uint256 tokenId) external view returns (uint256) {
        return trackPlaysThisPeriod[tokenId];
    }
    
    /**
     * @dev Get pending revenue for an artist
     * @param artist The artist address
     * @return pending Pending revenue amount
     */
    function getPendingRevenue(address artist) external view returns (uint256) {
        return artistPendingRevenue[artist];
    }
    
    /**
     * @dev Get time until next distribution
     * @return secondsRemaining Seconds until distribution can be called
     */
    function getTimeUntilDistribution() external view returns (uint256) {
        uint256 nextDistribution = lastDistributionTime + DISTRIBUTION_PERIOD;
        if (block.timestamp >= nextDistribution) {
            return 0;
        }
        return nextDistribution - block.timestamp;
    }
    
    /**
     * @dev Get distribution statistics
     * @return currentRevenue Current subscription revenue pool
     * @return currentPlays Total plays this period
     * @return lastDistribution Timestamp of last distribution
     * @return totalDistributed Total historical distributions
     */
    function getDistributionStats() external view returns (
        uint256 currentRevenue,
        uint256 currentPlays,
        uint256 lastDistribution,
        uint256 totalDistributed_
    ) {
        return (
            subscriptionRevenue,
            totalPlaysThisPeriod,
            lastDistributionTime,
            totalDistributed
        );
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Emergency withdraw in case of critical issues
     * @param to Address to send funds to
     */
    function emergencyWithdraw(address payable to) external onlyOwner {
        require(to != address(0), "Invalid address");
        
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool sent, ) = to.call{value: balance}("");
        require(sent, "Withdraw failed");
        
        emit EmergencyWithdraw(to, balance);
    }
    
    /**
     * @dev Update artist for a track (in case of transfer/error)
     * @param tokenId The token ID
     * @param newArtist The new artist address
     */
    function updateTrackArtist(uint256 tokenId, address newArtist) external onlyOwner {
        require(newArtist != address(0), "Invalid artist address");
        require(trackArtist[tokenId] != address(0), "Track not registered");
        
        trackArtist[tokenId] = newArtist;
        
        emit TrackRegistered(tokenId, newArtist);
    }
    
    // ============ Receive Function ============
    
    /**
     * @dev Accept ETH payments
     */
    receive() external payable {
        subscriptionRevenue += msg.value;
        emit SubscriptionRevenueAdded(msg.value, block.timestamp);
    }
}
