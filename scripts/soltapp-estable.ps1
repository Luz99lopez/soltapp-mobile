param([Parameter(Mandatory = $true)][ValidateSet('Start', 'Stop')][string]$Action)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$serverScript = Join-Path $PSScriptRoot 'serve-web-local.cjs'
$runtimeDir = Join-Path $projectRoot '.soltapp-stable'
$statePath = Join-Path $runtimeDir 'server.json'
$sha = [Security.Cryptography.SHA256]::Create()
$projectHash = ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($projectRoot.ToLowerInvariant())))).Replace('-', '').ToLowerInvariant()
$sha.Dispose()
$mutex = New-Object Threading.Mutex($false, "Local\Soltapp-$projectHash")
$locked = $false

function Read-State {
    if (Test-Path -LiteralPath $statePath) {
        try { return Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json } catch { return $null }
    }
    return $null
}

function Get-OwnedProcess($state) {
    if (!$state -or $state.projectHash -ne $projectHash -or $state.port -ne 8081) { return $null }
    $info = Get-CimInstance Win32_Process -Filter "ProcessId = $([int]$state.pid)" -ErrorAction SilentlyContinue
    if (!$info -or !$info.CommandLine -or !$info.CommandLine.Contains($serverScript)) { return $null }
    $started = [DateTimeOffset]::Parse($state.startedAt).UtcDateTime
    if ([Math]::Abs(($info.CreationDate.ToUniversalTime() - $started).TotalSeconds) -gt 5) { return $null }
    $owned = Get-Process -Id ([int]$state.pid) -ErrorAction SilentlyContinue
    if (!$owned -or [Math]::Abs(($owned.StartTime.ToUniversalTime() - $started).TotalSeconds) -gt 5) { return $null }
    return $owned
}

function Read-Health {
    try { return Invoke-RestMethod 'http://localhost:8081/__soltapp/status' -TimeoutSec 2 } catch { return $null }
}

try {
    try { $locked = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $locked = $true }
    if (!$locked) { throw 'Ya hay un inicio o una detencion de Soltapp en curso. Espera a que termine.' }
    $state = Read-State
    $owned = Get-OwnedProcess $state
    if ($Action -eq 'Stop') {
        if ($owned) {
            Stop-Process -InputObject $owned -ErrorAction Stop
            $owned.WaitForExit(5000) | Out-Null
            if ($owned.HasExited -eq $false) { throw 'El servidor no termino. No se detuvieron otros procesos.' }
            Write-Host 'Soltapp estable detenido. No se cerraron servidores ajenos.'
        } else { Write-Host 'No hay un servidor estable identificado de este proyecto para detener.' }
        if ($state -and !(Get-OwnedProcess $state)) { Remove-Item -LiteralPath $statePath -ErrorAction SilentlyContinue }
    } else {
        $branch = & git -C $projectRoot branch --show-current
        if ($LASTEXITCODE -ne 0 -or $branch.Trim() -ne 'feature/modulo-detalle-producto') {
            throw 'Este inicio requiere la rama feature/modulo-detalle-producto. No se cambio de rama.'
        }
        if ($owned) {
            $health = Read-Health
            if (!$health -or $health.instanceId -ne $state.instanceId -or $health.projectHash -ne $projectHash -or $health.mode -ne 'production') {
                throw 'El servidor identificado no responde correctamente. Ejecuta DETENER_SOLTAPP_ESTABLE y vuelve a iniciar.'
            }
            Write-Host "Soltapp estable ya esta activo (PID $($owned.Id)). Se reutiliza sin duplicarlo."
        } else {
            if (Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue) {
                throw 'El puerto 8081 esta ocupado por un servidor no administrado por estos archivos. No se cerro. Detenelo desde su propia terminal y vuelve a iniciar.'
            }
            $nodeExe = (Get-Command node -CommandType Application -ErrorAction Stop).Source
            $expoCli = Join-Path $projectRoot 'node_modules\expo\bin\cli'
            if (!(Test-Path -LiteralPath $expoCli)) { throw 'Faltan las dependencias locales del proyecto. No se instalaron paquetes automaticamente.' }
            New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
            Write-Host 'Preparando el build web de produccion. La compilacion ocurre ahora, antes de abrir Chrome.'
            Push-Location $projectRoot
            try {
                & $nodeExe $expoCli export --platform web
                if ($LASTEXITCODE -ne 0) { throw 'Fallo la compilacion. El servidor no se inicio. Revisa los errores anteriores.' }
            } finally { Pop-Location }
            $process = Start-Process -FilePath $nodeExe -ArgumentList ('"{0}" 8081 --managed' -f $serverScript) -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDir 'server.log') -RedirectStandardError (Join-Path $runtimeDir 'server-error.log')
            $ready = $false
            for ($attempt = 0; $attempt -lt 30; $attempt++) {
                if ($process.HasExited) { throw "El servidor no pudo arrancar. Revisa $runtimeDir\server-error.log" }
                $state = Read-State
                $health = Read-Health
                if ($state -and $state.pid -eq $process.Id -and $health -and $health.instanceId -eq $state.instanceId -and $health.projectHash -eq $projectHash) { $ready = $true; break }
                Start-Sleep -Milliseconds 300
            }
            if (!$ready) {
                # Solo el proceso recien creado y validado; nunca buscar/matar por puerto.
                $owned = Get-OwnedProcess (Read-State)
                if ($owned -and $owned.Id -eq $process.Id) { Stop-Process -InputObject $owned }
                throw "El servidor no confirmo el arranque. Revisa $runtimeDir\server-error.log"
            }
            Write-Host "Soltapp estable listo (PID $($process.Id))."
        }
        Write-Host 'URL: http://localhost:8081/login'
        Write-Host 'Para aplicar cambios de codigo: DETENER y luego INICIAR.'
        if ($env:SOLTAPP_NO_BROWSER -ne '1') { Start-Process 'http://localhost:8081/login' }
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    if ($locked) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
