// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import:
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Custom ERC20 token contract
contract MyERC20Token is ERC20 {
    address public owner;

    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") {
        // Mint initial supply of tokens
        _mint(msg.sender, initialSupply * (10 ** uint256(decimals())));
        owner = msg.sender;
    }

    function mint(uint256 amount) public {
        _mint(msg.sender, amount);
    }

    
    function mintFor(address recipient, uint256 amount) public {
        require(msg.sender == owner, "Only owner can mint tokens for others");
        _mint(recipient, amount);
    }
}

contract SupplyChain{

    MyERC20Token public token;

    // state variables
    uint public registrationFee= 10;
    address public owner;
    uint256 public productIndex;
    uint256 public orderIndex;
 
    // mapping 
    mapping(address => bool) public admins;
    mapping(address => bool) public retailers;
    mapping(address => bool) registeredRetailers;
    mapping(address => bool) public customers;
    mapping(uint256 => Product) public products;
    mapping(uint256 => Order) public orders;
    
   // modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender] == true, "Only admin can call this function");
        _;
    }

    modifier onlyRetailer() {
        require(registeredRetailers[msg.sender] == true, "Only retailer can call this function");
        _;
    }

    modifier onlyCustomer() {
    require(retailers[msg.sender] == false && admins[msg.sender] == false && msg.sender != owner, "Only customer can call this function");
    _;
    }
    
    //enumerator
    enum OrderStatus { Pending, Fulfilled, Cancelled }

    // structures
    struct Product {
        uint256 id;
        string name;
        uint256 price;
        uint256 quantity;
        address payable retailer;
    }
 
    struct Order {
        uint256 id;
        uint256 productId;
        uint256 quantity;
        address customer;
        address retailer;
        bool fulfilled;
        bool delivered;
        OrderStatus status;
    }

    struct Retailer {
        string name;
        address addr;
        
    }

    // events
    event ProductAdded(uint256 indexed _productId, string _name, uint256 _price, uint256 _quantity, address _retailer);
    event OrderPlaced(uint256 indexed _orderId, uint256 _productId, uint256 _quantity, address _customer, address _retailer);
    event OrderFulfilled(uint256 indexed _orderId, uint256 _quantity, address _customer, address _retailer);
    event OrderDelivered(uint256 indexed _orderId, uint256 _quantity, address _customer, address _retailer);
    event RegistrationFeeChanged(uint newRegistrationFee);
    event RetailerAdded(address indexed retailer);
    event RetailerRemoved(address indexed retailer);
    event RetailerRegistered(address indexed retailer);

    // constructor to set token address and contract owner
    constructor(MyERC20Token tokenAddress) payable{
        token = tokenAddress;
        owner = msg.sender;
    }

    // admin functions
    function addAdmin(address _admin) public onlyOwner {
        admins[_admin] = true;
    }

    function removeAdmin(address _admin) public onlyOwner {
        admins[_admin] = false;
    }

    // retailer functions

    function registerRetailer() public payable{
        require(msg.sender != owner, "Owner cannot be a retailer");
        require(!registeredRetailers[msg.sender], "Retailer already registered");

        bool allowanceSuccessful = token.approve(address(this), registrationFee);
        require(allowanceSuccessful, "Token allowance failed");

        bool transferSuccessful = token.transferFrom(msg.sender, owner, registrationFee);
        require(transferSuccessful, "Token transfer failed");
        registeredRetailers[msg.sender] = true;
        emit RetailerRegistered(msg.sender);
    }

    // admin functions
     function addRetailer(address _retailer) public onlyAdmin {
        require(registeredRetailers[_retailer], "Retailer is not registered.");
        emit RetailerAdded(_retailer);
    }

    function removeRetailer(address _retailer) public onlyAdmin {
    require(registeredRetailers[_retailer], "Retailer is not registered.");
    delete registeredRetailers[_retailer];
    emit RetailerRemoved(_retailer);
    }

    // customer functions
    function addCustomer(address _customer) public onlyAdmin {
        customers[_customer] = true;
    }

    function removeCustomer(address _customer) public onlyAdmin {
        customers[_customer] = false;
    }
    
    // owner function
    function changeRegistrationFee(uint newRegistrationFee) public onlyOwner {
        registrationFee = newRegistrationFee;
        emit RegistrationFeeChanged(newRegistrationFee);
    }  

    // retailer function

    function addProduct(string memory _name, uint256 _price, uint256 _quantity) public onlyRetailer returns (uint256) {
        productIndex++;
        products[productIndex] = Product(productIndex, _name, _price, _quantity, payable(msg.sender));
        emit ProductAdded(productIndex, _name, _price, _quantity, msg.sender);
        return productIndex;
    }

    function placeOrder(uint256 _productId, uint256 _quantity) public payable onlyCustomer {
        require(products[_productId].quantity >= _quantity, "Insufficient quantity");
        require(products[_productId].price > 0, "Product does not exist");
        require(msg.sender != products[_productId].retailer, "Retailer cannot place order");

        // Ensure that only the customer can place the order
        require(msg.sender == tx.origin, "Only the customer can place an order");

        require(token.transferFrom(msg.sender, products[_productId].retailer, products[_productId].price), "Transfer failed");
        orderIndex++;
        products[_productId].quantity -= _quantity;
        orders[orderIndex] = Order(orderIndex, _productId, _quantity, msg.sender, products[_productId].retailer, false, false, OrderStatus.Pending);
        emit OrderPlaced(orderIndex, _productId, _quantity, msg.sender, products[_productId].retailer);
    }

    function fulfillOrder(uint256 _orderId) public onlyRetailer {
        Order storage order = orders[_orderId];
        require(order.fulfilled == false, "Order already fulfilled");
        require(order.status == OrderStatus.Pending, "Order is not pending");
    
        // Check product quantity
        require(products[order.productId].quantity >= order.quantity, "Insufficient product quantity");
    
        order.fulfilled = true;
        products[order.productId].quantity -= order.quantity;
        emit OrderFulfilled(_orderId, order.quantity, order.customer, order.retailer);
    }


    function deliverOrder(uint256 _orderId) public onlyRetailer {
        Order storage order = orders[_orderId];
        require(order.delivered == false, "Order already delivered");
        require(order.fulfilled == true, "Order not fulfilled yet");
        order.delivered = true;
        order.status = OrderStatus.Fulfilled; // Update the status to fulfilled after the order is delivered
        emit OrderDelivered(_orderId, order.quantity, order.customer, order.retailer);
    }

}