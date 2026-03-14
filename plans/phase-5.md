# Fase 5: Installer + Distribucion

## Objetivo
Cualquier usuario tecnico puede instalar con un comando.

## Contexto requerido
- V1 completa (Fase 4)

## Pasos

### Paso 5.1: electron-builder
- Targets: Win/Mac/Linux x x64/arm64
- **Criterio de done:** Builds generados para las 3 plataformas

### Paso 5.2: GitHub Releases + checksums
- SHA-256 checksums por build
- **Criterio de done:** Release publicado con assets y checksums

### Paso 5.3: install.sh (macOS/Linux)
- Detectar OS/arch, descargar, checksum, extraer, FFmpeg estatico
- macOS: xattr -cr (workaround sin certificado)
- **Criterio de done:** Script funciona en macOS arm64 y Linux x64

### Paso 5.4: install.ps1 (Windows)
- Invoke-WebRequest, extraer a %LOCALAPPDATA%, PATH, FFmpeg
- **Criterio de done:** Script funciona en Windows x64

### Paso 5.5: Auto-update
- electron-updater, check al iniciar, download en background
- **Criterio de done:** Update detectado y aplicado

### Paso 5.6: Landing page minima
- Instrucciones + screenshots
- **Criterio de done:** Pagina publicada

## Gate
- [ ] Instalacion funciona en macOS arm64, Linux x64, Windows x64
- [ ] Auto-update funcional
