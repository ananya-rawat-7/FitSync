$ErrorActionPreference = "Stop"
$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$trackedFiles = @("app.js", "index.html", "styles.css")
$logDirectory = Join-Path $env:LOCALAPPDATA "FitSync"
$logPath = Join-Path $logDirectory "auto-push.log"

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

function Write-Log {
  param([string]$Message)
  Add-Content -Path $logPath -Value "$(Get-Date -Format o) $Message"
}

function Invoke-Git {
  param([string[]]$GitArguments)
  $gitPath = (Get-Command git.exe -ErrorAction Stop).Source
  $tempPrefix = Join-Path $env:TEMP ("fitsync-git-" + [guid]::NewGuid().ToString("N"))
  $stdoutPath = "$tempPrefix.out"
  $stderrPath = "$tempPrefix.err"
  $argumentLine = ($GitArguments | ForEach-Object {
    if ($_ -match '[\s"]') { '"' + $_.Replace('"', '\"') + '"' }
    else { $_ }
  }) -join " "

  try {
    $process = Start-Process -FilePath $gitPath -ArgumentList $argumentLine -WorkingDirectory (Get-Location).Path -NoNewWindow -PassThru -Wait -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
    foreach ($line in Get-Content $stdoutPath -ErrorAction SilentlyContinue) {
      Write-Log ([string]$line)
    }
    foreach ($line in Get-Content $stderrPath -ErrorAction SilentlyContinue) {
      Write-Log ([string]$line)
    }
    if ($process.ExitCode -ne 0) {
      throw "Git command failed (exit $($process.ExitCode)): git $($GitArguments -join ' ')"
    }
  } finally {
    Remove-Item $stdoutPath, $stderrPath -ErrorAction SilentlyContinue
  }
}

try {
  Set-Location $repoPath
  $env:GIT_TERMINAL_PROMPT = "0"
  $branch = (& git branch --show-current 2>$null).Trim()
  if ($LASTEXITCODE -ne 0 -or $branch -ne "main") {
    throw "Expected the repository's main branch; found '$branch'."
  }

  $changes = & git status --porcelain -- @trackedFiles
  if ($LASTEXITCODE -ne 0) {
    throw "Could not inspect the FitSync files."
  }
  if (-not $changes) {
    Write-Log "No changes in the configured FitSync files."
    exit 0
  }

  Invoke-Git -GitArguments (@("commit", "--only", "-m", "Auto-sync FitSync changes", "--") + $trackedFiles)
  Invoke-Git -GitArguments @("push", "origin", "main")
  Write-Log "FitSync changes pushed successfully."
} catch {
  Write-Log "ERROR: $($_.Exception.Message)"
  exit 1
}