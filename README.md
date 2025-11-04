# 🔐 Cerradura Inteligente - Smart Lock App

Aplicación web de control remoto para cerradura electrónica inteligente con autenticación biométrica, reconocimiento de voz y gestión de accesos.

## ✨ Características

- 🔓 **Control Remoto**: Abre y cierra la cerradura desde cualquier lugar
- 👆 **Autenticación Biométrica**: Reconocimiento de huella dactilar
- 🎤 **Reconocimiento de Voz**: Comandos de voz en español
- 🔑 **Autenticación por Contraseña**: Acceso seguro con contraseña
- 📊 **Historial de Accesos**: Registro completo de intentos de acceso
- 🔋 **Indicador de Batería**: Monitoreo del nivel de carga
- 📱 **Interfaz Responsive**: Funciona en móvil, tablet y desktop

## 🚀 Inicio Rápido

### Requisitos
- Node.js 14+
- npm o pnpm

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/anddreypj/smart-lock-app.git
cd smart-lock-app

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build
```

## 📱 Uso

1. Abre la aplicación en tu navegador
2. Ingresa la IP de tu ESP32
3. Haz clic en "Conectar"
4. Usa cualquiera de los métodos de acceso:
   - Botón de abrir/cerrar
   - Contraseña
   - Huella dactilar
   - Comandos de voz

## 🔧 Configuración del ESP32

La app se conecta al ESP32 a través de su IP usando una API REST. El ESP32 debe tener implementados los siguientes endpoints:

- `GET /status` - Obtener estado de la cerradura
- `POST /unlock` - Abrir cerradura
- `POST /lock` - Cerrar cerradura
- `POST /verify-password` - Verificar contraseña
- `POST /set-password` - Guardar nueva contraseña
- `POST /register-fingerprint` - Registrar huella
- `POST /delete-fingerprint` - Eliminar huella

## 📦 Tecnologías

- React 18
- Vite
- CSS3
- Web Speech API (Reconocimiento de Voz)

## 📄 Licencia

MIT

## 👨‍💻 Autor

Smart Lock Project

---

**Acceso a la app**: https://anddreypj.github.io/smart-lock-app
