# 🚀 Despliegue — New Horizon POS

---

## 📋 Requisitos

| Recurso | Versión Mínima |
|---------|---------------|
| Node.js | 20.x (recomendado 24.x) |
| npm | 10.x |
| MySQL / MariaDB | 8.0 / 10.4 |
| Disco | 500 MB libres (sin imágenes) |
| RAM | 512 MB (API) + 256 MB (Frontend static) |

---

## 🏗️ Build para Producción

### 1. Backend

```bash
cd FACTURACION/api

# Instalar dependencias
npm ci --omit=dev

# Compilar TypeScript
npm run build

# Configurar entorno
cp config/production.env.example config/production.env
# Editar production.env con credenciales reales
```

**Variables de entorno (`config/production.env`):**

```env
APP_PORT=3000
APP_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=tu_contraseña
DB_NAME=pos_db
JWT_SECRET_KEY=tu_secreto_jwt_aqui
JWT_REFRESH_SECRET=tu_secreto_refresh_aqui

# SAT Digifact (Facturación Electrónica)
NIT_EFACE=000044653948
USERNAME_DTE=GT.000044653948.PRUEBAS56
PASS_DTE=w&LWv8h_
URL_DTE=https://felgttestaws.digifact.com.gt
```

> **Importante:** Cambiar JWT secrets en producción. Usar `openssl rand -hex 64` para generarlos.

### 2. Frontend

```bash
cd FACTURACION/front

# Instalar dependencias
npm ci --omit=dev

# Compilar
npm run build
# Los archivos estáticos quedan en front/dist/
```

**Variables de entorno (`.env.production`):**

```env
VITE_API_URL=https://api.misitio.com/api
```

---

## 🖥️ Opciones de Despliegue

### Opción A: Servidor Node.js Directo (PM2)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar API
cd FACTURACION/api
pm2 start dist/app.js --name newhorizon-api
pm2 save

# Servir frontend con serve (opcional)
npm install -g serve
serve -s front/dist -l 5173

# O mejor: servir con nginx (recomendado)
```

**ecosystem.config.js:**

```javascript
module.exports = {
  apps: [{
    name: 'newhorizon-api',
    script: 'dist/app.js',
    cwd: './FACTURACION/api',
    instances: 1,
    exec_mode: 'fork',
    env: {
      APP_ENV: 'production',
      NODE_ENV: 'production'
    },
    max_memory_restart: '512M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
```

### Opción B: Nginx como Reverse Proxy (RECOMENDADO)

```nginx
# /etc/nginx/sites-available/newhorizon

server {
    listen 80;
    server_name mipos.com;

    # Redirección a HTTPS (opcional con Let's Encrypt)
    # return 301 https://$host$request_uri;
    #}

#server {
    #listen 443 ssl;
    #server_name mipos.com;

    #ssl_certificate /etc/letsencrypt/live/mipos.com/fullchain.pem;
    #ssl_certificate_key /etc/letsencrypt/live/mipos.com/privkey.pem;

    # Frontend (React SPA)
    root /home/user/FACTURACION/front/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API (proxy a Node.js)
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout largo para DTE (SAT puede tardar)
        proxy_read_timeout 120s;
    }

    # Archivos subidos (imágenes)
    location /uploads/ {
        alias /home/user/FACTURACION/api/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Compresión gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;
    gzip_comp_level 6;
}
```

---

## 🗄️ Base de Datos

### Migraciones en Producción

```bash
cd FACTURACION/api

# Verificar migraciones pendientes
npx sequelize-cli db:migrate:status

# Ejecutar
npm run migration:run

# Seeders (solo la primera vez)
npm run seed:run
```

### Eliminar Triggers Legacy

```bash
mysql -u root -p pos_db -e "
DROP TRIGGER IF EXISTS tr_updStockIngreso;
DROP TRIGGER IF EXISTS tr_updStockVenta;
"
```

### Backup Diario (cron recomendado)

```bash
# /etc/cron.daily/newhorizon-backup
#!/bin/bash
BACKUP_DIR=/backups/newhorizon
mkdir -p $BACKUP_DIR
mysqldump -u root -pTU_PASS pos_db | gzip > $BACKUP_DIR/db_$(date +%Y%m%d_%H%M%S).sql.gz
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

---

## 🔒 Seguridad

### Checklist de Producción

- [ ] **JWT Secrets:** Cambiar `JWT_SECRET_KEY` y `JWT_REFRESH_SECRET` (generar con `openssl rand -hex 64`)
- [ ] **HTTPS:** Configurar Let's Encrypt + certbot en nginx
- [ ] **CORS:** Restringir orígenes en Express (no usar `cors()` sin configuración)
- [ ] **MySQL:** Usuario con solo los privilegios necesarios (no root)
- [ ] **MySQL:** Cambiar contraseña por defecto
- [ ] **PM2:** Configurar restart en caso de fallo
- [ ] **Logs:** Rotación de logs con `logrotate`
- [ ] **Uploads:** Validar tipo MIME en producción (no solo extensión)
- [ ] **Rate Limiting:** Agregar `express-rate-limit` a endpoints sensibles (login)

### CORS Restringido

```typescript
// En server.ts, reemplazar:
this.app.use(cors());
// Por:
this.app.use(cors({
  origin: ['https://mipos.com', 'https://admin.mipos.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 📊 Monitoreo

### Logs de PM2

```bash
pm2 logs newhorizon-api       # Ver logs en tiempo real
pm2 monit                    # Dashboard interactivo
pm2 status                   # Estado de procesos
```

### Endpoint Health Check

La API expone `GET /api/check` sin autenticación para monitoreo:

```bash
curl https://mipos.com/api/check
# → { ok: true, message: "API funcionando correctamente" }
```

### Logs de Auditoría

Todos los cambios importantes quedan registrados en:
- **Base de datos:** Tabla `bitacora_logs` (consultable desde el frontend en `/audit`)
- **Consola API:** Errores de auditoría se loguean como `[Audit] Error al registrar: ...`

---

## 🔄 Actualización

```bash
# 1. Pull del repositorio
git pull origin main

# 2. Backend
cd FACTURACION/api
npm ci --omit=dev
npm run build
npm run migration:run
pm2 restart newhorizon-api

# 3. Frontend
cd FACTURACION/front
npm ci --omit=dev
npm run build
# Si usas nginx, no necesitas reiniciar (solo servir nuevos archivos estáticos)
```

---

## 🐛 Troubleshooting

| Problema | Causa Posible | Solución |
|----------|--------------|----------|
| `ECONNREFUSED` en DB | MySQL no corriendo | `systemctl start mysql` |
| `JWT_EXPIRED` | Token expirado | El frontend hace refresh automático; si persiste, verificar hora del servidor |
| `DTE_ERROR` | SAT fuera de línea | Reintentar; la venta NO se crea (transaccional) |
| `413 Request Entity Too Large` | Imagen muy grande | Configurar `client_max_body_size` en nginx (`50M`) |
| Login falla tras migración | `createdAt`/`updatedAt` faltantes | Ejecutar `npm run migration:run` |
| Stock duplicado | Triggers legacy activos | Ejecutar `DROP TRIGGER` (ver sección BD) |
