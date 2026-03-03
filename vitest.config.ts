import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Archivos de test: cualquier .test.ts dentro de src/
    include: ['**/*.test.ts'],
    // Entorno Node (por defecto) — ideal para tests de backend
    environment: 'node',
    // Habilitar globals (describe, it, expect) sin importar
    globals: true,
  },
});
