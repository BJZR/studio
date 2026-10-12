# Studio

Chat web multi-IA con herramientas especializadas: detectar y humanizar (flujo automático), humanizar, detectar, crear, convertir, editar y resumir. Importa y crea documentos.

## Ejecutar

Sin Go (solo estático):

    cd web && python3 -m http.server 8787

Con Go (sirve la web y un proxy opcional contra CORS):

    cd server && go run .

Abre http://127.0.0.1:8787 y configura un proveedor con «Proveedores».

## Proveedores

- Compatible con OpenAI: Ollama, LM Studio, llama.cpp, OpenAI, Groq, OpenRouter, DeepSeek y similares.
- Anthropic y Google Gemini.

Ollama necesita permitir el origen del navegador: `OLLAMA_ORIGINS=* ollama serve`.
Si una API bloquea CORS, activa «Usar proxy Go» en el proveedor.

Las claves se guardan en `localStorage` del navegador.

## Documentos

Importar (botón, arrastrar y soltar, o «Adjuntar» en el chat; se admiten varios a la vez):
docx, odt, pptx, xlsx, rtf, html, txt, md, csv, json, xml, yaml y código. Lectura propia sin dependencias.
- pdf: carga pdf.js desde cdnjs solo al importar un PDF (requiere conexión).
- doc antiguo (binario): extracción aproximada; mejor guardarlo como docx.

Crear (menú «Exportar como…» en cada resultado y en cada respuesta del chat):
docx, pdf, odt, rtf, html, md y txt, generados desde cero en el navegador.
El texto se interpreta como Markdown (títulos, listas, negrita, cursiva, código y tablas).
Limitaciones: el PDF usa fuentes estándar (solo caracteres Latin-1/WinAnsi) y no admite tablas reales.

## Detectar y humanizar

Flujo automático: detecta el % de IA, humaniza, vuelve a detectar y repite hasta cumplir la meta o agotar las rondas
(la intensidad sube en cada ronda y se usan las señales detectadas como guía). Entrega la mejor versión obtenida.
La puntuación la estima el modelo configurado: es orientativa y no garantiza el resultado ante detectores externos.

## Estructura

    web/
      index.html
      css/            base, layout, components
      js/
        main.js       arranque y render
        core/         store, dom, chats, drafts, markdown, texto, avisos
        docs/         zip/ (leer y escribir ZIP), import/ (un lector por formato), export/ (un escritor por formato)
        providers/    una función por API + registro y presets
        tools/        una herramienta por archivo + registro y ejecución
        ui/           sidebar, topbar, chat, panel de herramientas, ajustes
    server/           servidor estático y proxy en Go

## Añadir una herramienta

Crea `web/js/tools/<nombre>.js` con `id`, `name`, `icon`, `summary`, `inputLabel`, `output`, `fields` y `build(values, input)`, y regístrala en `tools/registry.js`.
