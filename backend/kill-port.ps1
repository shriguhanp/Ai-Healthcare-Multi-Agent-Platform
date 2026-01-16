# PowerShell script to kill process using a specific port
param(
    [int]$Port = 5000
)

Write-Host "Checking for processes using port $Port..."

$connections = netstat -ano | findstr ":$Port"
if ($connections) {
    $pids = $connections | ForEach-Object {
        if ($_ -match '\s+(\d+)\s*$') {
            $matches[1]
        }
    } | Sort-Object -Unique
    
    if ($pids) {
        Write-Host "Found processes using port $Port: $($pids -join ', ')"
        foreach ($pid in $pids) {
            try {
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "Killing process $pid ($($process.ProcessName))..."
                    taskkill /F /PID $pid
                    Write-Host "✓ Process $pid terminated"
                }
            } catch {
                Write-Host "Could not kill process $pid: $_"
            }
        }
        Write-Host "`nPort $Port should now be free!"
    } else {
        Write-Host "No processes found using port $Port"
    }
} else {
    Write-Host "Port $Port is already free!"
}

