# Script para descargar archivos desde Vercel
$deploymentId = "dpl_9oLNYomdM3Tpz4bSsrmRXBozCdjJ"
$token = (vercel whoami 2>&1 | Select-String "token" | ForEach-Object { $_.ToString().Split(":")[1].Trim() })

Write-Host "Descargando archivos del deployment $deploymentId..."
Write-Host "Este proceso puede tardar varios minutos..."

# Obtener lista de archivos
$headers = @{
    "Authorization" = "Bearer $token"
}

$url = "https://api.vercel.com/v6/deployments/$deploymentId/files"

try {
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
    Write-Host "Archivos encontrados: $($response.Count)"
    
    # Descargar cada archivo
    foreach ($file in $response) {
        $filePath = $file.name
        $fileUrl = "https://api.vercel.com/v6/deployments/$deploymentId/files/$filePath"
        
        Write-Host "Descargando: $filePath"
        
        # Crear directorio si no existe
        $dir = Split-Path -Parent $filePath
        if ($dir -and !(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        
        # Descargar archivo
        Invoke-RestMethod -Uri $fileUrl -Headers $headers -Method Get -OutFile $filePath
    }
    
    Write-Host "¡Descarga completada!"
} catch {
    Write-Host "Error: $_"
    Write-Host "Intenta descargar manualmente desde: https://vercel.com/salonflow/posventa/$deploymentId/source"
}
