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
    
    // Subscription struct
    struct SubscriptionPlan {
        uint256 price;
        uint256 duration; // in seconds
        bool exists;
    }
    
    // User subscription info
    struct UserSubscription {
        uint256 planId;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        uint256 totalPaid;
    }
    
    // Mapping from plan ID to subscription plan
    mapping(uint256 => SubscriptionPlan) public subscriptionPlans;
    
    // Mapping from user address to subscription info
    mapping(address => UserSubscription) public userSubscriptions;
    
    // Events
    event Subscribed(address indexed user, uint256 planId, uint256 amount, uint256 startTime, uint256 endTime);
    event SubscriptionExtended(address indexed user, uint256 planId, uint256 amount, uint256 newEndTime);
    event SubscriptionCancelled(address indexed user);
    event Withdrawn(address indexed to, uint256 amount);
    
    // Modifiers
    modifier onlySubscribed() {
        require(isSubscribed(msg.sender), "Not subscribed");
        _;
    }
    
    // Constructor
    constructor(address _priceFeed) {
        priceFeed = _priceFeed;
        
        // Initialize subscription plans
        // 0: Daily plan ($0.25/day)
        subscriptionPlans[0] = SubscriptionPlan({
            price: DAILY_PRICE,
            duration: 1 days,
            exists: true
        });
        
        // 1: Monthly plan ($2.50/month, ~10% discount)
        subscriptionPlans[1] = SubscriptionPlan({
            price: MONTHLY_PRICE,
            duration: 30 days,
            exists: true
        });
    }
    
    // Subscribe to a plan with USDC
    function subscribeWithUSDC(uint256 planId) external nonReentrant {
        _subscribe(planId, false, 0);
    }
    
    // Subscribe to a plan with ETH
    function subscribeWithETH(uint256 planId) external payable nonReentrant {
        _subscribe(planId, true, msg.value);
    }
    
    // Internal subscribe function
    function _subscribe(uint256 planId, bool isETH, uint256 ethAmount) internal {
        require(subscriptionPlans[planId].exists, "Invalid plan");
        
        SubscriptionPlan memory plan = subscriptionPlans[planId];
        uint256 amount = plan.price;
        
        if (isETH) {
            // Convert ETH to USDC equivalent using price feed (simplified)
            // In a real implementation, you would use Chainlink Price Feed
            require(ethAmount > 0, "No ETH sent");
            // For demo purposes, we'll just check if enough ETH was sent
            // In production, you would use Chainlink Price Feed to get the exact rate
            // and check if the sent ETH is sufficient
            require(ethAmount >= amount, "Insufficient ETH amount");
        } else {
            // Transfer USDC from user to this contract
            IERC20 usdc = IERC20(usdcToken);
            require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        }
        
        UserSubscription storage sub = userSubscriptions[msg.sender];
        uint256 currentTime = block.timestamp;
        
        // If user already has an active subscription, extend it
        if (sub.isActive && sub.endTime > currentTime) {
            sub.endTime += plan.duration;
            emit SubscriptionExtended(msg.sender, planId, amount, sub.endTime);
        } else {
            // Otherwise, create a new subscription
            sub.planId = planId;
            sub.startTime = currentTime;
            sub.endTime = currentTime + plan.duration;
            sub.isActive = true;
            emit Subscribed(msg.sender, planId, amount, sub.startTime, sub.endTime);
        }
        
        // Update total paid
        sub.totalPaid += amount;
    }
    
    // Cancel subscription (only affects auto-renewal)
    function cancelSubscription() external onlySubscribed {
        userSubscriptions[msg.sender].isActive = false;
        emit SubscriptionCancelled(msg.sender);
    }
    
    // Check if a user is currently subscribed
    function isSubscribed(address user) public view returns (bool) {
        UserSubscription memory sub = userSubscriptions[user];
        return sub.isActive && block.timestamp <= sub.endTime;
    }
    
    // Get user's subscription info
    function getUserSubscription(address user) external view returns (
        uint256 planId,
        uint256 startTime,
        uint256 endTime,
        bool active,
        uint256 totalPaid
    ) {
        UserSubscription memory sub = userSubscriptions[user];
        return (
            sub.planId,
            sub.startTime,
            sub.endTime,
            sub.isActive && block.timestamp <= sub.endTime,
            sub.totalPaid
        );
    }
    
    // Withdraw funds (only owner)
    function withdraw(address to, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        
        // Check contract balance
        IERC20 usdc = IERC20(usdcToken);
        uint256 balance = usdc.balanceOf(address(this));
        require(balance >= amount, "Insufficient balance");
        
        // Transfer USDC to the specified address
        require(usdc.transfer(to, amount), "Transfer failed");
        
        emit Withdrawn(to, amount);
    }
    
    // Set price feed address (only owner)
    function setPriceFeed(address _priceFeed) external onlyOwner {
        priceFeed = _priceFeed;
    }
    
    // Set USDC token address (only owner)
    function setUsdcToken(address _usdcToken) external onlyOwner {
        require(_usdcToken != address(0), "Invalid address");
        usdcToken = _usdcToken;
    }
    
    // Fallback function to receive ETH
    receive() external payable {}
    
    // Allow owner to withdraw ETH
    function withdrawETH(address payable to, uint256 amount) external onlyOwner {
        require(amount > 0 && amount <= address(this).balance, "Invalid amount");
        to.transfer(amount);
    }
}
