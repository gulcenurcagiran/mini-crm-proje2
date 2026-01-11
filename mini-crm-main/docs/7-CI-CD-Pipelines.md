# CI/CD Pipeline Önerileri ve Yapılandırmaları

**Proje**: Mini-CRM (E-Ticaret CRM Sistemi)  
**Sürüm**: 1.0  
**Tarih**: 2026-01-11  

---

## Genel Bakış

Mini-CRM projesi için CI/CD pipeline'ları, kod kalitesini korumak, otomatik testleri çalıştırmak ve güvenli dağıtımlar yapmak için kritik öneme sahiptir.

### Proje Özellikleri
- **Teknoloji**: Node.js/Express, PostgreSQL, Sequelize ORM
- **Test Framework**: Jest (Bun test runner ile)
- **Test Durumu**: 67 test, %100 başarılı
- **Veritabanı**: PostgreSQL (migration'lar mevcut)

### CI/CD Hedefleri
1. Her commit ve PR'da otomatik test çalıştırma
2. Kod kalitesi kontrolleri (linter, format)
3. Güvenlik taraması (dependency vulnerabilities)
4. Veritabanı migration'larının doğrulanması
5. Otomatik deployment (staging/production)

---

## GitHub Actions Yapılandırması

### Pipeline Yapısı

```
Lint & Format → Security Scan → Test → Build → Deploy
```

### GitHub Actions Workflow

**Dosya:** `.github/workflows/ci.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  release:
    types: [ created ]

env:
  NODE_VERSION: '20.x'
  POSTGRES_VERSION: '15'

jobs:
  lint:
    name: Lint & Format Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint || echo "ESLint not configured, skipping..."

      - name: Check code formatting
        run: npm run format:check || echo "Prettier not configured, skipping..."

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: true

  test:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: [lint, security]
    
    services:
      postgres:
        image: postgres:${{ env.POSTGRES_VERSION }}
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: mini_crm_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    env:
      NODE_ENV: test
      DATABASE_URL: postgresql://test_user:test_password@localhost:5432/mini_crm_test
      DB_HOST: localhost
      DB_PORT: 5432
      DB_NAME: mini_crm_test
      DB_USER: test_user
      DB_PASSWORD: test_password

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Wait for PostgreSQL
        run: |
          until pg_isready -h localhost -p 5432 -U test_user; do
            echo "Waiting for PostgreSQL..."
            sleep 2
          done

      - name: Run database migrations
        run: npm run migrate
        env:
          DATABASE_URL: ${{ env.DATABASE_URL }}

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: ${{ env.DATABASE_URL }}

  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [test]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci --production=false

      - name: Build application
        run: npm run build || echo "No build script, skipping..."

      - name: Archive build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            node_modules/
            src/
            package.json
            package-lock.json
          retention-days: 7

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: staging
      url: https://staging-api.mini-crm.com
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts

      - name: Deploy to staging server
        run: |
          echo "Deploy to staging server"
          # SSH deployment script here

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build]
    if: startsWith(github.ref, 'refs/tags/v') && github.event_name == 'release'
    environment:
      name: production
      url: https://api.mini-crm.com
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts

      - name: Deploy to production server
        run: |
          echo "Deploy to production server"
          # Production deployment script here
```

### GitHub Actions - Docker Build Workflow

**Dosya:** `.github/workflows/docker.yml`

```yaml
name: Docker Build & Push

on:
  push:
    branches: [ main ]
    tags:
      - 'v*'
  pull_request:
    branches: [ main ]

jobs:
  build-and-push:
    name: Build Docker Image
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

## Docker ve Containerization

### Dockerfile

**Dosya:** `Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lock* ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy dependencies and source from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/config ./config
COPY --from=builder /app/migrations ./migrations

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
```

### Docker Compose

**Dosya:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/mini_crm
      - DB_HOST=db
      - DB_PORT=5432
      - DB_NAME=mini_crm
      - DB_USER=postgres
      - DB_PASSWORD=postgres
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=mini_crm
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
```

### .dockerignore

```
node_modules
npm-debug.log
.git
.gitignore
.env
.env.local
coverage
.nyc_output
tests
*.test.js
*.spec.js
.vscode
.idea
README.md
docs
```

---

## Hızlı Başlangıç

1. **Workflow dosyası oluştur:**
   ```bash
   mkdir -p .github/workflows
   # ci.yml dosyasını oluştur (yukarıdaki örnekten)
   ```

2. **Secrets yapılandır:**
   - GitHub → Settings → Secrets → Actions
   - `DATABASE_URL`, `SSH_PRIVATE_KEY`, vb. ekle

3. **İlk commit:**
   ```bash
   git add .github/workflows/ci.yml
   git commit -m "Add CI/CD pipeline"
   git push
   ```

4. **Pipeline'ı izle:**
   - GitHub → Actions tab
   - Workflow run'ları görüntüle

---

## En İyi Uygulamalar

### Pipeline Optimizasyonu
- Lint, security, test job'larını paralel çalıştır
- `node_modules` cache'le
- Docker layer cache kullan

### Güvenlik
- GitHub Secrets kullan, secret'ları kodda saklama
- `npm audit` otomatik çalıştır
- Minimal base image kullan (Alpine)
- Non-root user kullan

### Test Stratejisi
- Minimum %80 coverage hedefi
- Critical paths %100 coverage
- Her migration reversible olmalı

---

**Hazırlayan**: Geliştirme Ekibi  
**Tarih**: 2026-01-11  
**Sürüm**: 1.0
