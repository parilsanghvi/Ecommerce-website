import os
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Load index.html content
    try:
        with open("frontend/build/index.html", "r") as f:
            html_content = f.read()
    except FileNotFoundError:
        print("Error: frontend/build/index.html not found. Did build fail?")
        return

    # 1. Handle SPA routing: Serve index.html for /product/1
    page.route("**/product/1", lambda route: route.fulfill(
        status=200,
        body=html_content,
        content_type="text/html"
    ))

    # 2. Mock Backend API
    page.route("**/api/v1/product/1", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"product": {"_id": "1", "name": "UX Test Product", "images": [], "price": 99, "ratings": 0, "numOfReviews": 0, "stock": 10, "description": "Testing UX"}}'
    ))

    # 3. Navigate
    print("Navigating to product page...")
    try:
        page.goto("http://localhost:8081/product/1")
    except Exception as e:
        print(f"Navigation failed: {e}")
        return

    # Wait for product to load
    print("Waiting for product name...")
    expect(page.get_by_text("UX Test Product")).to_be_visible(timeout=10000)

    # 4. Open Review Dialog
    print("Opening Review Dialog...")
    page.get_by_role("button", name="LOG A REVIEW").click()

    # 5. Verify Accessibility and State
    print("Verifying Dialog...")

    # Verify Textarea accessible name
    textarea = page.get_by_label("Review comment")
    expect(textarea).to_be_visible()

    # Verify Submit button disabled initially (rating 0, comment empty)
    submit_btn = page.get_by_role("button", name="Submit")
    expect(submit_btn).to_be_disabled()
    print("Button disabled correctly.")

    # 6. Interact
    print("Interacting...")
    textarea.fill("Great product!")

    # Click 5 Stars
    dialog = page.locator(".MuiDialog-paper")
    # Material UI uses a label wrapping the icon, and puts text in visually hidden span
    # We can use get_by_label if the label text is there?
    # The label has <span class="MuiRating-visuallyHidden">5 Stars</span>
    # Playwright's get_by_label might look for aria-label or for attribute.
    # get_by_text("5 Stars") should work if it's in the DOM.

    # Let's try locating by text "5 Stars" and clicking it.
    # Note: It is visually hidden, so we might need force=True.
    five_stars = dialog.get_by_text("5 Stars")
    five_stars.click(force=True)

    # Now button should be enabled
    expect(submit_btn).to_be_enabled()
    print("Button enabled correctly.")

    # Take screenshot
    page.screenshot(path="verification/review_dialog.png")
    print("Screenshot saved to verification/review_dialog.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
