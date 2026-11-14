# Servidor local para ver la tienda en tu computadora (no hace falta instalar nada).
# Uso: clic derecho > "Ejecutar con PowerShell", y abre http://localhost:5173
param([int]$Puerto = 5173)
$raiz = $PSScriptRoot
$tipos = @{
  ".html" = "text/html; charset=utf-8"; ".css" = "text/css; charset=utf-8"; ".js" = "text/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"; ".svg" = "image/svg+xml"; ".png" = "image/png"; ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"; ".webp" = "image/webp"; ".avif" = "image/avif"; ".gif" = "image/gif"; ".ico" = "image/x-icon"
  ".glb" = "model/gltf-binary"; ".gltf" = "model/gltf+json"; ".bin" = "application/octet-stream"; ".txt" = "text/plain; charset=utf-8"
  ".woff2" = "font/woff2"; ".mp4" = "video/mp4"; ".hdr" = "application/octet-stream"
}
$servidor = New-Object System.Net.HttpListener
$servidor.Prefixes.Add("http://localhost:$Puerto/")
$servidor.Start()
Write-Host "Tienda disponible en http://localhost:$Puerto  (Ctrl+C para detener)"
try {
  while ($servidor.IsListening) {
    $ctx = $servidor.GetContext()
    try {
      $ruta = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart("/")
      if ($ruta -eq "" -or $ruta.EndsWith("/")) { $ruta += "index.html" }
      $archivo = [IO.Path]::GetFullPath((Join-Path $raiz $ruta))
      $estado = 200
      if (-not $archivo.StartsWith($raiz, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $archivo -PathType Leaf)) {
        $archivo = Join-Path $raiz "404.html"; $estado = 404
      }
      $bytes = [IO.File]::ReadAllBytes($archivo)
      $ext = [IO.Path]::GetExtension($archivo).ToLower()
      $ctx.Response.StatusCode = $estado
      $ctx.Response.ContentType = if ($tipos.ContainsKey($ext)) { $tipos[$ext] } else { "application/octet-stream" }
      $ctx.Response.Headers["Cache-Control"] = "no-cache"
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch { try { $ctx.Response.StatusCode = 500 } catch {} }
    finally { try { $ctx.Response.Close() } catch {} }
  }
} finally { $servidor.Stop() }
