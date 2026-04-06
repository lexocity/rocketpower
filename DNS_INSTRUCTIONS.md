# Connecting RLESRocketPower.com to Your App

To connect your custom domain, follow these two steps:

### Step 1: Add the Domain in Render
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Select your **rocketpower** service.
3. Go to **Settings** in the left sidebar.
4. Scroll down to the **Custom Domains** section.
5. Click **Add Custom Domain** and enter `RLESRocketPower.com`.
6. Click **Save**.

### Step 2: Update Your DNS Settings
Log in to your domain registrar (e.g., GoDaddy, Namecheap) and add these two records:

| Type | Name | Value |
| :--- | :--- | :--- |
| **A** | `@` | `216.24.57.1` |
| **CNAME** | `www` | `rocketpower.onrender.com` |

---

### Important Notes:
- **SSL/HTTPS:** Render will automatically issue a free SSL certificate for your domain once the DNS is verified.
- **Propagation:** It can take anywhere from a few minutes to 24 hours for DNS changes to take effect globally.
- **Login:** You can continue using the app at [https://rocketpower.onrender.com](https://rocketpower.onrender.com) while the domain is connecting.
