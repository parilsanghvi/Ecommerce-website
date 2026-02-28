const { calculateOrderPrices } = require("../../utils/pricing");

describe("Pricing Utility", () => {
  test("should calculate correct tax and shipping for price below threshold", () => {
    const itemsPrice = 500;
    const { taxPrice, shippingPrice, totalPrice } = calculateOrderPrices(itemsPrice);

    expect(taxPrice).toBe(500 * 0.18); // 90
    expect(shippingPrice).toBe(200);
    expect(totalPrice).toBe(500 + 90 + 200); // 790
  });

  test("should calculate correct tax and shipping for price above threshold", () => {
    const itemsPrice = 1500;
    const { taxPrice, shippingPrice, totalPrice } = calculateOrderPrices(itemsPrice);

    expect(taxPrice).toBe(1500 * 0.18); // 270
    expect(shippingPrice).toBe(0);
    expect(totalPrice).toBe(1500 + 270 + 0); // 1770
  });

  test("should handle price exactly at threshold", () => {
      // Logic says > 1000 is free. So 1000 is not free.
      const itemsPrice = 1000;
      const { taxPrice, shippingPrice, totalPrice } = calculateOrderPrices(itemsPrice);

      expect(taxPrice).toBe(1000 * 0.18); // 180
      expect(shippingPrice).toBe(200);
      expect(totalPrice).toBe(1000 + 180 + 200); // 1380
  });
});
