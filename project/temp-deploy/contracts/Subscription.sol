// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Subscription is ReentrancyGuard, Ownable {
    // USDC token address (Base Sepolia testnet USDC)
    address public usdcToken = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    
    // Base ETH address for native token payments
    address constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    
    // Price oracle interface (simplified for this example)
    address public priceFeed;
    
    // Subscription plans in USDC (with 18 decimals)
    uint256 public constant DAILY_PRICE = 25 * 10**5; // $0.25 per day
    uint256 public constant MONTHLY_PRICE = 25 * 10**17; // $2.50 per month (with 10% discount)
    uint256 public constant YEARLY_PRICE = 25 * 10**18; // $25.00 per year (with 15% discount)
    
    // Subscription struct
    struct SubscriptionInfo {
        uint256 startTime;
        uint256 endTime;
        bool isActive;
    }
    
    // User subscriptions
    mapping(address => SubscriptionInfo) public subscriptions;
    
    // Events
    event Subscribed(address indexed user, uint256 plan, uint256 amount, uint256 duration);
    event SubscriptionExtended(address indexed user, uint256 plan, uint256 amount, uint256 newEndTime);
    event Withdrawn(address indexed to, uint256 amount);
    
    constructor(address _priceFeed) {
        priceFeed = _priceFeed;
        // Transfer ownership to deployer
        transferOwnership(msg.sender);
    }
    
    // Get subscription status
    function getSubscriptionStatus(address user) public view returns (bool isActive, uint256 remainingTime) {
        SubscriptionInfo memory sub = subscriptions[user];
        isActive = sub.isActive && block.timestamp < sub.endTime;
        remainingTime = sub.endTime > block.timestamp ? sub.endTime - block.timestamp : 0;
        return (isActive, remainingTime);
    }
    
    // Subscribe with USDC
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
        
        // Transfer USDC from user to contract
        bool success = IERC20(usdcToken).transferFrom(msg.sender, address(this), amount);
        require(success, "USDC transfer failed");
        
        // Update subscription
        _updateSubscription(msg.sender, duration);
        
        emit Subscribed(msg.sender, plan, amount, duration);
    }
    
    // Subscribe with native token (ETH)
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
        
        // Refund excess ETH
        if (msg.value > requiredETH) {
            payable(msg.sender).transfer(msg.value - requiredETH);
        }
        
        // Update subscription
        _updateSubscription(msg.sender, duration);
        
        emit Subscribed(msg.sender, plan, amount, duration);
    }
    
    // Internal function to update subscription
    function _updateSubscription(address user, uint256 duration) internal {
        SubscriptionInfo storage sub = subscriptions[user];
        
        if (sub.isActive && sub.endTime > block.timestamp) {
            // Extend existing subscription
            sub.endTime += duration;
            emit SubscriptionExtended(user, 0, 0, sub.endTime);
        } else {
            // New subscription
            sub.startTime = block.timestamp;
            sub.endTime = block.timestamp + duration;
            sub.isActive = true;
        }
    }
    
    // Withdraw funds (only owner)
    function withdraw(address token, uint256 amount) external onlyOwner {
        if (token == ETH) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
        emit Withdrawn(owner(), amount);
    }
    
    // Set price feed (only owner)
    function setPriceFeed(address _priceFeed) external onlyOwner {
        priceFeed = _priceFeed;
    }
    
    // Set USDC token address (only owner)
    function setUSDCToken(address _usdcToken) external onlyOwner {
        usdcToken = _usdcToken;
    }
    
    // Get ETH price in USD (simplified - in production use Chainlink)
    function getETHPrice() public view returns (uint256) {
        // This is a simplified version. In production, you would use Chainlink's price feed
        // For Base Sepolia, you might use the following Chainlink price feed:
        // ETH/USD: 0x694AA1769357215DE4FAC081bf1f309aDC325306
        
        // Mock price (1 ETH = $2000 for this example)
        // In production, replace this with actual price feed call
        return 2000 * 10**8; // 8 decimals for consistency with Chainlink
    }
    
    // Receive function to accept ETH
    receive() external payable {}
}
