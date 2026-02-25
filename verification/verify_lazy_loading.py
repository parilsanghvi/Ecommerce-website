from playwright.sync_api import sync_playwright

def test_lazy_loading():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Verify Home Page (Eager)
        try:
            print("Navigating to Home...")
            page.goto("http://localhost:3000", timeout=60000)
            page.wait_for_selector("text=Featured Drops", timeout=30000)
            print("Home page loaded successfully.")
            page.screenshot(path="verification/home_verification.png")
        except Exception as e:
            print(f"Failed to verify Home page: {e}")
            # Log page content for debugging
            # print(page.content())
            browser.close()
            return

        # 2. Verify Products Page (Lazy)
        try:
            print("Navigating to Products...")
            page.goto("http://localhost:3000/products", timeout=60000)
            # "Price Range" is a unique text in Products component
            page.wait_for_selector("text=Price Range", timeout=30000)
            print("Products page loaded successfully.")
            page.screenshot(path="verification/products_verification.png")
        except Exception as e:
            print(f"Failed to verify Products page: {e}")
            # print(page.content())

        browser.close()

if __name__ == "__main__":
    test_lazy_loading()
