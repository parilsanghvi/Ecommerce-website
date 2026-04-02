## 2024-04-02 - Add Rate Limiting to Sensitive Endpoints
**Vulnerability:** Missing rate limiting on password reset and update endpoints
**Learning:** While login and registration were rate-limited, the password reset and update routes were not, creating a vulnerability for brute force and Denial of Service (DoS) attacks.
**Prevention:** Always ensure that all authentication-related endpoints, including token verification and password updates, have appropriate rate limiting middleware applied.
