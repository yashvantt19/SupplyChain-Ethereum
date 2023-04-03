const SupplyChain = artifacts.require("SupplyChain");
const MyERC20Token = artifacts.require("MyERC20Token");

contract("SupplyChain", (accounts) => {
  let supplyChain;
  let myERC20Token;

  const owner = accounts[0];
  const retailer = accounts[1];
  const customer = accounts[2];
  const registrationFee = 1000000000000000000;

  before(async () => {
    myERC20Token = await MyERC20Token.new("MyToken", "MTK", owner, 1000000, {
      from: owner,
    });
    supplyChain = await SupplyChain.new(myERC20Token.address, { from: owner });
    await myERC20Token.transfer(retailer, 100000, { from: owner });
    await myERC20Token.transfer(customer, 100000, { from: owner });
  });

  describe("Retailer registration", () => {
    it("should allow retailer registration with a registration fee", async () => {
      await myERC20Token.approve(supplyChain.address, registrationFee, {
        from: retailer,
      });
      await supplyChain.registerRetailer({ from: retailer });
      const isRetailer = await supplyChain.registeredRetailers(retailer);
      assert.equal(isRetailer, true);
    });

    it("should not allow retailer registration with an insufficient registration fee", async () => {
      await myERC20Token.approve(supplyChain.address, registrationFee - 1, {
        from: customer,
      });
      try {
        await supplyChain.registerRetailer({ from: customer });
        assert.fail();
      } catch (error) {
        assert.include(error.message, "revert");
      }
    });

    it("should not allow owner registration as a retailer", async () => {
      await myERC20Token.approve(supplyChain.address, registrationFee, {
        from: owner,
      });
      try {
        await supplyChain.registerRetailer({ from: owner });
        assert.fail();
      } catch (error) {
        assert.include(error.message, "revert");
      }
    });

    it("should not allow duplicate retailer registration", async () => {
      await myERC20Token.approve(supplyChain.address, registrationFee, {
        from: retailer,
      });
      try {
        await supplyChain.registerRetailer({ from: retailer });
        assert.fail();
      } catch (error) {
        assert.include(error.message, "revert");
      }
    });
  });

  describe("Product management", () => {
    before(async () => {
      await myERC20Token.approve(supplyChain.address, registrationFee, {
        from: retailer,
      });
      await supplyChain.registerRetailer({ from: retailer });
    });

    it("should allow a retailer to add a product", async () => {
      const tx = await supplyChain.addProduct("Product 1", 100, 10, {
        from: retailer,
      });
      const productId = tx.logs[0].args._productId.toNumber();
      const product = await supplyChain.products(productId);
      assert.equal(product.id, productId);
      assert.equal(product.name, "Product 1");
      assert.equal(product.price, 100);
      assert.equal(product.quantity, 10);
      assert.equal(product.retailer, retailer);
    });

    it("should not allow a non-retailer to add a product", async () => {
      try {
        await supplyChain.addProduct("Product 2", 200, 20, { from: customer });
        assert.fail();
      } catch (error) {
        assert.include(error.message, "revert");
      }
    });

    it("should not allow a retailer to add a product with a price of 0", async () => {
      try {
        await supplyChain.addProduct("Product 2", 0, 20, { from: retailer1 });
        assert.fail();
      } catch (error) {
        assert.include(error.message, "revert");
      }
    });

    it("should not allow a retailer to add a product with a negative quantity", async () => {
      try {
        await supplyChain.addProduct("Product 3", 300, -10, {
          from: retailer1,
        });
        assert.fail();
      } catch (error) {
        assert.include(error.message, "revert");
      }
    });

    it("should allow a customer to place an order for a product", async () => {
      const productId = await supplyChain.addProduct("Product 4", 400, 30, {
        from: retailer1,
      });
      const quantity = 5;
      const price = 400 * quantity;

      await supplyChain.placeOrder(productId, quantity, {
        from: customer,
        value: price,
      });

      const order = await supplyChain.orders(1);

      assert.equal(order.id, 1);
      assert.equal(order.productId, productId);
      assert.equal(order.quantity, quantity);
      assert.equal(order.customer, customer);
      assert.equal(order.retailer, retailer1);
      assert.equal(order.fulfilled, false);
      assert.equal(order.delivered, false);
      assert.equal(order.status, "0");
    });

    it("should not allow a customer to place an order for a non-existent product", async () => {
      const nonExistentProductId = 99;
      const quantity = 5;
      const price = 400 * quantity;

      try {
        await supplyChain.placeOrder(nonExistentProductId, quantity, {
          from: customer,
          value: price,
        });
        assert.fail();
      } catch (error) {
        assert.include(error.message, "revert");
      }
    });

    it("should not allow a customer to place an order for a product with insufficient quantity", async () => {
      const productId = await supplyChain.addProduct("Product 5", 500, 10, {
        from: retailer1,
      });
      const quantity = 20;
      const price = 500 * quantity;

      try {
        await supplyChain.placeOrder(productId, quantity, {
          from: customer,
          value: price,
        });
        assert.fail();
      } catch (error) {
        assert.include(error.message, "revert");
      }
    });

    it("should not allow a retailer to fulfill an order for a non-existent order ID", async () => {
      const nonExistentOrderId = 99;

      try {
        await supplyChain.fulfillOrder(nonExistentOrderId, { from: retailer1 });
        assert.fail();
      } catch (error) {
        assert.include(error.message, "revert");
      }
    });

    it("should not allow a non-retailer to fulfill an order", async () => {
      const productId = await supplyChain.addProduct("Product 6", 600, 20, {
        from: retailer1,
      });
      const quantity = 5;
      const price = 600 * quantity;

      await supplyChain.placeOrder(productId, quantity, {
        from: customer,
        value: price,
      });

      const order = await supplyChain.orders(1);

      try {
        await supplyChain.fulfillOrder(order.id, { from: customer });
        assert.fail();
      } catch (error) {
        assert.include(error.message, "revert");
      }
    });

    it("should not allow a retailer to fulfill an order that has already been fulfilled", async () => {
      const productId = await supplyChain.addProduct("Product 7", 700, 30, {
        from: retailer,
      });
      const orderId = await supplyChain.placeOrder(productId, 2, {
        from: customer,
      });
      await supplyChain.fulfillOrder(orderId, { from: retailer });

      try {
        await supplyChain.fulfillOrder(orderId, { from: retailer });
        assert.fail();
      } catch (error) {
        assert.include(error.message, "revert");
      }
    });

    it("should not allow a retailer to deliver an order that has not been fulfilled", async () => {
      const productId = await supplyChain.addProduct("Product 8", 800, 40, {
        from: retailer,
      });
      const orderId = await supplyChain.placeOrder(productId, 2, {
        from: customer,
      });

      try {
        await supplyChain.deliverOrder(orderId, { from: retailer });
        assert.fail();
      } catch (error) {
        assert.include(error.message, "revert");
      }
    });

    it("should allow a retailer to deliver a fulfilled order", async () => {
      const productId = await supplyChain.addProduct("Product 9", 900, 50, {
        from: retailer,
      });
      const orderId = await supplyChain.placeOrder(productId, 2, {
        from: customer,
      });
      await supplyChain.fulfillOrder(orderId, { from: retailer });
      const tx = await supplyChain.deliverOrder(orderId, { from: retailer });
      assert.equal(tx.logs[0].event, "OrderDelivered");
      assert.equal(tx.logs[0].args._orderId.toNumber(), orderId);
      assert.equal(tx.logs[0].args._quantity.toNumber(), 2);
      assert.equal(tx.logs[0].args._customer, customer);
      assert.equal(tx.logs[0].args._retailer, retailer);

      const order = await supplyChain.orders(orderId);
      assert.equal(order.state, OrderState.Delivered);
    });
  });
});
