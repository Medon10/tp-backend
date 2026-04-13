# Instalación y puesta en marcha

Para ejecutar el proyecto es necesario levantar dos servidores simultáneamente: el **backend** (lógica y base de datos) y el **frontend** (interfaz de usuario).

---

## A. Backend (`tp-backend`)

### Requisitos previos
- Node.js v18 o superior
- NPM (se instala junto con Node.js)
- Un servidor MySQL corriendo

### Pasos

**1. Clonar el repositorio**
```bash
git clone https://github.com/Medon10/tp-backend.git
cd tp-backend
```

**2. Instalar dependencias**
```bash
npm install
```

**3. Configurar la base de datos**
- Asegurate de que tu servidor MySQL esté corriendo
- Creá una base de datos llamada `VuelosApp`
- Ejecutá los comandos del archivo `docs/mysql-commands.sql` para crear las tablas

**4. Crear el archivo de entorno**

Copiá el archivo de ejemplo y completá las variables con tus datos:
```bash
cp .env.example .env
```

**5. Iniciar el servidor**
```bash
npm run dev
```

 Si todo va bien, verás en la terminal: `Servidor corriendo en http://localhost:3000`

---

## B. Frontend (`tp-frontend`)

### Requisitos previos
- Node.js v18 o superior
- NPM

### Pasos

**1. Clonar el repositorio**
```bash
git clone https://github.com/Medon10/tp-frontend.git
cd tp-frontend
```

**2. Instalar dependencias**
```bash
npm install
```

**3. Iniciar el servidor de desarrollo**

> Asegurate de que el servidor del backend ya esté corriendo antes de este paso.

```bash
npm run dev
```

✅ La aplicación estará disponible en `http://localhost:5173`