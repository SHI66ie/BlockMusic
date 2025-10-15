// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IRevenueDistribution {
    function receiveSubscriptionPayment(uint256 usdcAmount) external payable;
}

contract SubscriptionV3 is ReentrancyGuard, Ownable {
    // Revenue distribution contract (handles 85/15 split)
    address public revenueDistribution;
    
    // USDC token address (Base Sepolia testnet USDC)
    address public usdcToken = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    
    // Subscription plans in USDC (with 6 decimals for USDC)
    uint256 public constant MONTHLY_PRICE = 25 * 10**5;      // $2.50
    uint256 public constant THREE_MONTH_PRICE = 675 * 10**4; // $6.75
    uint256 public constant YEARLY_PRICE = 25 * 10**6;       // $25.00
    
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
    event RevenueDistributionUpdated(address indexed newContract);
    event USDCTokenUpdated(address indexed newToken);
    
    constructor(address _revenueDistribution) {
        require(_revenueDistribution != address(0), "Invalid revenue distribution address");
        revenueDistribution = _revenueDistribution;
        transferOwnership(msg.sender);
    }
    
    /**
     * @notice Check if user has active subscription
     */
    function isSubscribed(address user) public view returns (bool) {
        SubscriptionInfo memory sub = userSubscriptions[user];
        return sub.isActive && block.timestamp < sub.endTime;
    }
    
    /**
     * @notice Get subscription status
     */
    function getSubscriptionStatus(address user) public view returns (
        bool isActive,
        uint256 remainingTime,
        uint256 endTime
    ) {
        SubscriptionInfo memory sub = userSubscriptions[user];
        isActive = sub.isActive && block.timestamp < sub.endTime;
        remainingTime = sub.endTime > block.timestamp ? sub.endTime - block.timestamp : 0;
        endTime = sub.endTime;
        return (isActive, remainingTime, endTime);
    }
    
    /**
     * @notice Subscribe with USDC
     * @param plan 1 = Monthly, 2 = 3 Months, 3 = Yearly
     */
    function subscribeWithUSDC(uint256 plan) external nonReentrant {
        require(plan >= 1 && plan <= 3, "Invalid plan");
        
        (uint256 amount, uint256 duration) = _getPlanDetails(plan);
        
        // Transfer USDC from user to this contract
        require(
            IERC20(usdcToken).transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );
        
        // Approve revenue distribution contract to spend USDC
        require(
            IERC20(usdcToken).approve(revenueDistribution, amount),
            "USDC approval failed"
        );
        
        // Send to revenue distribution (handles 85/15 split)
        IRevenueDistribution(revenueDistribution).receiveSubscriptionPayment(amount);
        
        // Update subscription
        _updateSubscription(msg.sender, duration, amount);
        
        emit Subscribed(msg.sender, plan, amount, duration);
    }
    
    /**
     * @notice Subscribe with ETH
     * @param plan 1 = Monthly, 2 = 3 Months, 3 = Yearly
     */
    function subscribeWithETH(uint256 plan) external payable nonReentrant {
        require(plan >= 1 && plan <= 3, "Invalid plan");
        require(msg.value > 0, "No ETH sent");
        
        (uint256 usdcEquivalent, uint256 duration) = _getPlanDetails(plan);
        
        // Get ETH price in USD (simplified - in production use Chainlink)
        uint256 ethPrice = getETHPrice();
        uint256 requiredETH = (usdcEquivalent * 1e18) / (ethPrice / 1e2); // Adjust for decimals
        
        require(msg.value >= requiredETH, "Insufficient ETH sent");
        
        // Send to revenue distribution (handles 85/15 split)
        IRevenueDistribution(revenueDistribution).receiveSubscriptionPayment{value: requiredETH}(0);
        
        // Refund excess ETH
        if (msg.value > requiredETH) {
            (bool refunded, ) = msg.sender.call{value: msg.value - requiredETH}("");
            require(refunded, "Failed to refund excess ETH");
        }
        
        // Update subscription
        _updateSubscription(msg.sender, duration, usdcEquivalent);
        
        emit Subscribed(msg.sender, plan, usdcEquivalent, duration);
    }
    
    /**
     * @notice Get plan details
     */
    function _getPlanDetails(uint256 plan) internal pure returns (uint256 amount, uint256 duration) {
        if (plan == 1) {
            // Monthly
            amount = MONTHLY_PRICE;
            duration = 30 days;
        } else if (plan == 2) {
            // 3 Months
            amount = THREE_MONTH_PRICE;
            duration = 90 days;
        } else {
            // Yearly
            amount = YEARLY_PRICE;
            duration = 365 days;
        }
        return (amount, duration);
    }
    
    /**
     * @notice Internal function to update subscription
     */
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
    
    /**
     * @notice Cancel subscription (prevents auto-renewal)
     */
    function cancelSubscription() external {
        require(userSubscriptions[msg.sender].isActive, "No active subscription");
        userSubscriptions[msg.sender].isActive = false;
    }
    
    /**
     * @notice Get ETH price in USD (simplified - in production use Chainlink)
     */
    function getETHPrice() public pure returns (uint256) {
        // Mock price: 1 ETH = $2000
        // Returns price with 8 decimals for consistency with Chainlink
        return 2000 * 10**8;
    }
    
    // Admin functions
    
    /**
     * @notice Update revenue distribution contract
     */
    function setRevenueDistribution(address _revenueDistribution) external onlyOwner {
        require(_revenueDistribution != address(0), "Invalid address");
        revenueDistribution = _revenueDistribution;
        emit RevenueDistributionUpdated(_revenueDistribution);
    }
    
    /**
     * @notice Update USDC token address
     */
    function setUSDCToken(address _usdcToken) external onlyOwner {
        require(_usdcToken != address(0), "Invalid address");
        usdcToken = _usdcToken;
        emit USDCTokenUpdated(_usdcToken);
    }
    
    /**
     * @notice Receive ETH
     */
    receive() external payable {}
}
