// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SubscriptionManager is Ownable, ReentrancyGuard {
    // Subscription plans
    enum Plan { Monthly, ThreeMonths, Yearly }
    
    // USDC token address on Base Sepolia (replace with actual USDC address)
    address public usdcToken;
    
    // Subscription prices in USDC (6 decimals)
    uint256 public constant MONTHLY_PRICE = 25 * 10**5;      // 2.5 USDC
    uint256 public constant THREE_MONTHS_PRICE = 675 * 10**4; // 6.75 USDC (10% discount from 7.5 USDC)
    uint256 public constant YEARLY_PRICE = 25 * 10**6;        // 25 USDC (15% discount from 30 USDC)
    
    // Subscription duration in seconds
    uint256 public constant MONTH = 30 days;
    uint256 public constant THREE_MONTHS = 90 days;
    uint256 public constant YEAR = 365 days;
    
    // User subscription data
    struct Subscription {
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        Plan plan;
    }
    
    // Mapping from user address to subscription data
    mapping(address => Subscription) public subscriptions;
    
    // Events
    event Subscribed(address indexed user, Plan plan, uint256 startTime, uint256 endTime);
    event SubscriptionExtended(address indexed user, Plan plan, uint256 newEndTime);
    event SubscriptionCancelled(address indexed user);
    event Withdrawn(address indexed to, uint256 amount);
    
    constructor(address _usdcToken) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC token address");
        usdcToken = _usdcToken;
    }
    
    /**
     * @dev Subscribe to a plan
     * @param plan The subscription plan to subscribe to
     */
    function subscribe(Plan plan) external nonReentrant {
        require(!isSubscribed(msg.sender), "Already subscribed");
        
        uint256 price = getPlanPrice(plan);
        uint256 duration = getPlanDuration(plan);
        
        // Transfer USDC from user to contract
        bool success = IERC20(usdcToken).transferFrom(msg.sender, address(this), price);
        require(success, "USDC transfer failed");
        
        // Create new subscription
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;
        
        subscriptions[msg.sender] = Subscription({
            startTime: startTime,
            endTime: endTime,
            isActive: true,
            plan: plan
        });
        
        emit Subscribed(msg.sender, plan, startTime, endTime);
    }
    
    /**
     * @dev Extend current subscription
     * @param plan The plan to extend with
     */
    function extendSubscription(Plan plan) external nonReentrant {
        require(isSubscribed(msg.sender), "No active subscription");
        
        uint256 price = getPlanPrice(plan);
        uint256 duration = getPlanDuration(plan);
        
        // Transfer USDC from user to contract
        bool success = IERC20(usdcToken).transferFrom(msg.sender, address(this), price);
        require(success, "USDC transfer failed");
        
        // Extend subscription
        uint256 currentEndTime = subscriptions[msg.sender].endTime;
        uint256 newEndTime = block.timestamp > currentEndTime 
            ? block.timestamp + duration 
            : currentEndTime + duration;
            
        subscriptions[msg.sender].endTime = newEndTime;
        subscriptions[msg.sender].plan = plan;
        
        emit SubscriptionExtended(msg.sender, plan, newEndTime);
    }
    
    /**
     * @dev Cancel subscription (only prevents auto-renewal)
     */
    function cancelSubscription() external {
        require(isSubscribed(msg.sender), "No active subscription");
        subscriptions[msg.sender].isActive = false;
        emit SubscriptionCancelled(msg.sender);
    }
    
    /**
     * @dev Withdraw collected funds (only owner)
     */
    function withdraw(address to) external onlyOwner {
        uint256 balance = IERC20(usdcToken).balanceOf(address(this));
        require(balance > 0, "No balance to withdraw");
        
        bool success = IERC20(usdcToken).transfer(to, balance);
        require(success, "Withdrawal failed");
        
        emit Withdrawn(to, balance);
    }
    
    /**
     * @dev Check if user is currently subscribed
     */
    function isSubscribed(address user) public view returns (bool) {
        return subscriptions[user].isActive && block.timestamp < subscriptions[user].endTime;
    }
    
    /**
     * @dev Get remaining subscription time in seconds
     */
    function getRemainingTime(address user) external view returns (uint256) {
        if (!isSubscribed(user)) return 0;
        return subscriptions[user].endTime - block.timestamp;
    }
    
    /**
     * @dev Get price for a plan
     */
    function getPlanPrice(Plan plan) public pure returns (uint256) {
        if (plan == Plan.Monthly) return MONTHLY_PRICE;
        if (plan == Plan.ThreeMonths) return THREE_MONTHS_PRICE;
        if (plan == Plan.Yearly) return YEARLY_PRICE;
        revert("Invalid plan");
    }
    
    /**
     * @dev Get duration for a plan in seconds
     */
    function getPlanDuration(Plan plan) public pure returns (uint256) {
        if (plan == Plan.Monthly) return MONTH;
        if (plan == Plan.ThreeMonths) return THREE_MONTHS;
        if (plan == Plan.Yearly) return YEAR;
        revert("Invalid plan");
    }
    
    /**
     * @dev Update USDC token address (only owner)
     */
    function setUsdcToken(address _usdcToken) external onlyOwner {
        require(_usdcToken != address(0), "Invalid address");
        usdcToken = _usdcToken;
    }
}
