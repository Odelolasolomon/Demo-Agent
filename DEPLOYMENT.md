# Deployment Guide (AWS Free Tier)

This guide explains how to deploy the MarketSenseAI application using AWS Free Tier services. 

**Architecture:**
- **Backend (API, Worker, Database)**: Deployed on an **AWS EC2** instance (Ubuntu, t2.micro) using Docker Compose.
- **Frontend (Next.js)**: Deployed on **AWS Amplify** (Free Tier) or Vercel.

---

## Part 1: Deploy Backend on AWS EC2

### 1. Launch EC2 Instance
1.  Log in to AWS Console and go to **EC2**.
2.  Click **Launch Instance**.
3.  **Name**: `MarketSenseAI-Backend`
4.  **AMI**: Select **Ubuntu Server 24.04 LTS** (Free Tier Eligible).
5.  **Instance Type**: `t2.micro` (or `t3.micro` if available in free trial).
6.  **Key Pair**: Create a new key pair (`market-key`), download the `.pem` file.
7.  **Network Settings**: 
    -   Click "Edit".
    -   Allow SSH (Port 22).
    -   Allow HTTP (Port 80).
    -   Allow Custom TCP (Port **8000**) - This is for the API.
8.  **Storage**: Set to 15-20 GB (Free tier allows up to 30GB EBS).
9.  Click **Launch Instance**.

### 2. Connect and Setup Server
1.  Open your terminal/PowerShell.
2.  Locate your `.pem` key file.
3.  Connect via SSH (replace `<PUBLIC-IP>` with your instance's IP):
    ```bash
    ssh -i "path/to/market-key.pem" ubuntu@<PUBLIC-IP>
    ```
4.  **Install Docker & Docker Compose**:
    ```bash
    # Update packages
    sudo apt-get update
    
    # Install Docker
    sudo apt-get install -y docker.io
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Add user to docker group (to run without sudo)
    sudo usermod -aG docker $USER
    
    # Install Docker Compose
    sudo apt-get install -y docker-compose-v2
    ```
    *Log out and log back in to apply group changes.* `exit` then `ssh ...` again.

### 3. Setup Swap Space (Create Memory Buffer)
Since `t2.micro` only has 1GB RAM, we need "swap" memory to prevent crashes during build.
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 4. Deploy Code
1.  **Clone the Repository**:
    ```bash
    git clone <YOUR_GITHUB_REPO_URL> app
    cd app
    ```
    *(If your repo is private, you'll need to generate a GitHub Personal Access Token and include it in the URL: `https://<TOKEN>@github.com/username/repo.git`)*

2.  **Configure Environment**:
    Create the `.env` file:
    ```bash
    nano .env
    ```
    Paste your environment variables (from your local `.env`):
    ```env
    GROQ_API_KEY=your_key_here
    GOOGLE_API_KEY=your_key_here
    # ... other keys ...
    ```
    Save (Ctrl+O, Enter) and Exit (Ctrl+X).

3.  **Start Services**:
    ```bash
    docker compose up -d --build
    ```
    *This may take 10-15 minutes to build.*

4.  **Verify**:
    Visit `http://<EC2-PUBLIC-IP>:8000/docs` in your browser. You should see the API Swagger UI.

---

## Part 2: Deploy Frontend on AWS Amplify

### 1. Setup Amplify
1.  Go to **AWS Amplify** in the AWS Console.
2.  Click **Create new app** -> **Gen 1** (or "Host web app").
3.  Select **GitHub** and authorize.
4.  Select your repository and branch (`master`).

### 2. Configure Build Settings
1.  Update the **Build settings** (Amplify usually auto-detects Next.js):
    -   Ensure `baseDirectory` is set to `frontend`.
    -   Or, if the repo root is mixed, modify `amplify.yml` to point to `frontend`.
    
    **Example `amplify.yml` if your Next.js app is in `frontend/` folder:**
    ```yaml
    version: 1
    applications:
      - frontend:
          phases:
            preBuild:
              commands:
                - npm ci
            build:
              commands:
                - npm run build
          artifacts:
            baseDirectory: .next
            files:
              - '**/*'
          cache:
            paths:
              - node_modules/**/*
        appRoot: frontend
    ```

3.  **Environment Variables**:
    Click "Advanced settings" or add Environment Variables during setup:
    -   Key: `NEXT_PUBLIC_API_URL`
    -   Value: `http://<EC2-PUBLIC-IP>:8000` (Use the IP from Part 1).

### 3. Deploy
1.  Click **Save and Deploy**.
2.  Amplify will build and deploy your site.
3.  Once finished, you will get a URL (e.g., `https://main.d1234.amplifyapp.com`).

---

## Important Note on Mixed Content (HTTPS vs HTTP)
- AWS Amplify serves your site over **HTTPS** (Secure).
- Your EC2 backend is likely on **HTTP** (Not Secure) unless you configure a domain and SSL.
- **Problem**: Browsers block "Mixed Content" (HTTPS site calling HTTP API).
- **Solution A (Quick)**: In your browser, click the "Lock" icon -> "Site Settings" -> "Insecure Content" -> **Allow**. (Only works for you).
- **Solution B (Proper)**: Use **Cloudflare** (Free) or **AWS Application Load Balancer** (Not Free) to add SSL to your EC2 instance.
    -   *Easiest Free SSL*: Buy a cheap domain ($1-10), point it to your EC2 IP, and run `certbot` within Nginx on your EC2 instance.

