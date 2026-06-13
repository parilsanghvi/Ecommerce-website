🎯 **What:** Added tests for the 400 error status code on the payment replay attack condition in the `newOrder` controller.
📊 **Coverage:** The `Payment already used` ErrorHandler calls now explicitly assert that a 400 status code is returned as expected.
✨ **Result:** Improved test reliability and ensured that regressions altering this status code will be caught by our CI pipeline.
