// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Chainlink AggregatorV3Interface
interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

contract SubscriptionV2 is ReentrancyGuard, Ownable {
    // Payment recipient address
    address public constant PAYMENT_RECIPIENT = 0x49eC6Fff8d915DC8F1FF382941D0c5DADF9F013B;
    
    // USDC token address (Base Sepolia testnet USDC)
    address public usdcToken = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    
    // Base ETH address for native token payments
    address constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    
    // Revenue Distributor contract address (for artist payments)
    address public revenueDistributor;
    
    // Platform fee from subscriptions (20%, rest goes to artists)
    uint256 public constant PLATFORM_FEE_PERCENT = 20;
    
    // Price oracle interface (simplified for this example)
    address public priceFeed;
    
    // Subscription plans in USDC (with 6 decimals to match USDC)
    uint256 public constant DAILY_PRICE = 25 * 10**4; // $0.25 per day = 250,000
    uint256 public constant MONTHLY_PRICE = 25 * 10**5; // $2.50 per month = 2,500,000
    uint256 public constant YEARLY_PRICE = 25 * 10**6; // $25.00 per year = 25,000,000
    
    // Subscription struct
    struct SubscriptionInfo {
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        uint256 totalPaid;
    }
    
    // User subscriptions
    mapping(address => SubscriptionInfo) public userSubscriptions;
    
    // Events
    event Subscribed(address indexed user, uint256 plan, uint256 amount, uint256 duration);
    event SubscriptionExtended(address indexed user, uint256 plan, uint256 amount, uint256 newEndTime);
    event PriceFeedUpdated(address newPriceFeed);
    event USDCTokenUpdated(address newUSDCToken);
    event RevenueDistributorUpdated(address newDistributor);
    event RevenueSplit(uint256 platformAmount, uint256 artistPoolAmount);
    
    constructor(address _priceFeed) Ownable(msg.sender) {
        priceFeed = _priceFeed;
    }
    
    // Check if user is currently subscribed (for compatibility with frontend)
    function isSubscribed(address user) public view returns (bool) {
        SubscriptionInfo memory sub = userSubscriptions[user];
        return sub.isActive && block.timestamp < sub.endTime;
    }
    
    // Get subscription status
    function getSubscriptionStatus(address user) public view returns (bool isActive, uint256 remainingTime) {
        SubscriptionInfo memory sub = userSubscriptions[user];
        isActive = sub.isActive && block.timestamp < sub.endTime;
        remainingTime = sub.endTime > block.timestamp ? sub.endTime - block.timestamp : 0;
        return (isActive, remainingTime);
    }
    
    // Subscribe with USDC - Modified to send directly to PAYMENT_RECIPIENT
    function subscribeWithUSDC(uint256 plan) external nonReentrant {
        require(plan == 1 || plan == 2 || plan == 3, "Invalid plan");
        
        uint256 amount;
        uint256 duration;
        
        if (plan == 1) { // Daily
            amount = DAILY_PRICE * 30; // 30 days
            duration = 30 days;
        } else if (plan == 2) { // Monthly
            amount = MONTHLY_PRICE;
            duration = 30 days;
        } else { // Yearly
            amount = YEARLY_PRICE;
            duration = 365 days;
        }
        
        // Transfer USDC from user directly to PAYMENT_RECIPIENT
        bool success = IERC20(usdcToken).transferFrom(msg.sender, PAYMENT_RECIPIENT, amount);
        require(success, "USDC transfer failed");
        
        // Update subscription
        _updateSubscription(msg.sender, duration, amount);
        
        emit Subscribed(msg.sender, plan, amount, duration);
    }
    
    // Subscribe with native token (ETH) - Split between platform and artist pool
    function subscribeWithETH(uint256 plan) external payable nonReentrant {
        require(plan == 1 || plan == 2 || plan == 3, "Invalid plan");
        
        uint256 amount;
        uint256 duration;
        
        if (plan == 1) { // Daily
            amount = DAILY_PRICE * 30; // 30 days
            duration = 30 days;
        } else if (plan == 2) { // Monthly
            amount = MONTHLY_PRICE;
            duration = 30 days;
        } else { // Yearly
            amount = YEARLY_PRICE;
            duration = 365 days;
        }
        
        // Get ETH price in USD (simplified - in production use Chainlink)
        uint256 ethPrice = getETHPrice();
        uint256 requiredETH = (amount * 1e18) / ethPrice;
        
        require(msg.value >= requiredETH, "Insufficient ETH sent");
        
        // Split payment: 20% to platform, 80% to artist pool
        uint256 platformAmount = (requiredETH * PLATFORM_FEE_PERCENT) / 100;
        uint256 artistPoolAmount = requiredETH - platformAmount;
        
        // Send platform fee
        (bool platformSent, ) = PAYMENT_RECIPIENT.call{value: platformAmount}("");
        require(platformSent, "Failed to send platform fee");
        
        // Send to revenue distributor for artists
        if (revenueDistributor != address(0) && artistPoolAmount > 0) {
            (bool artistSent, ) = revenueDistributor.call{value: artistPoolAmount}("");
            require(artistSent, "Failed to send to artist pool");
            emit RevenueSplit(platformAmount, artistPoolAmount);
        } else {
            // Fallback: send to platform if distributor not set
            (bool fallbackSent, ) = PAYMENT_RECIPIENT.call{value: artistPoolAmount}("");
            require(fallbackSent, "Failed to send fallback");
        }
        
        // Refund excess ETH
        if (msg.value > requiredETH) {
            (bool refunded, ) = msg.sender.call{value: msg.value - requiredETH}("");
            require(refunded, "Failed to refund excess ETH");
        }
        
        // Update subscription
        _updateSubscription(msg.sender, duration, amount);
        
        emit Subscribed(msg.sender, plan, amount, duration);
    }
    
    // Internal function to update subscription
    function _updateSubscription(address user, uint256 duration, uint256 amount) internal {
        SubscriptionInfo storage sub = userSubscriptions[user];
        
        if (sub.isActive && sub.endTime > block.timestamp) {
            // Extend existing subscription
            sub.endTime += duration;
            sub.totalPaid += amount;
            emit SubscriptionExtended(user, 0, amount, sub.endTime);
        } else {
            // New subscription
            sub.startTime = block.timestamp;
            sub.endTime = block.timestamp + duration;
            sub.isActive = true;
            sub.totalPaid = amount;
        }
    }
    
    // Set price feed (only owner)
    function setPriceFeed(address _priceFeed) external onlyOwner {
        priceFeed = _priceFeed;
        emit PriceFeedUpdated(_priceFeed);
    }
    
    // Set USDC token address (only owner)
    function setUSDCToken(address _usdcToken) external onlyOwner {
        usdcToken = _usdcToken;
        emit USDCTokenUpdated(_usdcToken);
    }
    
    // Get ETH price in USD
    function getETHPrice() public view returns (uint256) {
        // If price feed is set, use it
        if (priceFeed != address(0)) {
            try AggregatorV3Interface(priceFeed).latestRoundData() returns (
                uint80,
                int256 price,
                uint256,
                uint256,
                uint80
            ) {
                require(price > 0, "Invalid price");
                return uint256(price); // Returns price with 8 decimals
            } catch {
                // Fallback to mock price if oracle fails
                return 2000 * 10**8;
            }
        }
        
        // Mock price (1 ETH = $2000 for testnet)
        return 2000 * 10**8; // 8 decimals for consistency with Chainlink
    }
    
    // Receive function to accept ETH (in case of accidental transfers)
    receive() external payable {}
    
    /**
     * @dev Set revenue distributor address (only owner)
     */
    function setRevenueDistributor(address _revenueDistributor) external onlyOwner {
        require(_revenueDistributor != address(0), "Invalid address");
        revenueDistributor = _revenueDistributor;
        emit RevenueDistributorUpdated(_revenueDistributor);
    }
    
    /**
     * @dev Get revenue distributor address
     */
    function getRevenueDistributor() external view returns (address) {
        return revenueDistributor;
    }
}
