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

  test("should handle itemsPrice as 0", () => {
    const itemsPrice = 0;
    const { taxPrice, shippingPrice, totalPrice } = calculateOrderPrices(itemsPrice);

    expect(taxPrice).toBe(0);
    expect(shippingPrice).toBe(200);
    expect(totalPrice).toBe(200);
  });

  test("should handle negative itemsPrice", () => {
    const itemsPrice = -500;
    const { taxPrice, shippingPrice, totalPrice } = calculateOrderPrices(itemsPrice);

    expect(taxPrice).toBe(-500 * 0.18); // -90
    expect(shippingPrice).toBe(200);
    expect(totalPrice).toBe(-500 + -90 + 200); // -390
  });

  test("should handle string that can be coerced to number", () => {
    const itemsPrice = "500";
    const { taxPrice, shippingPrice, totalPrice } = calculateOrderPrices(itemsPrice);

    expect(taxPrice).toBe(500 * 0.18); // 90
    expect(shippingPrice).toBe(200);
    expect(totalPrice).toBe(500 + 90 + 200); // 790
  });

  test("should handle NaN or invalid string (coerced to NaN)", () => {
    const itemsPrice = "abc";
    const { taxPrice, shippingPrice, totalPrice } = calculateOrderPrices(itemsPrice);

    expect(Number.isNaN(taxPrice)).toBe(true);
    expect(shippingPrice).toBe(200); // NaN > 1000 is false, so it returns 200
    expect(Number.isNaN(totalPrice)).toBe(true);
  });
});
