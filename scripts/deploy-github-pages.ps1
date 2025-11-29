param(
  [Parameter(Mandatory=$true)][string]$Token,
  [string]$Username = "HaiderAli52891",
  [string]$RepoName = "{0}.github.io" -f $Username.ToLower(),
  [string]$Root = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

function To-Base64($Path){
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  return [System.Convert]::ToBase64String($bytes)
}

function ApiHeaders(){
  return @{ 
    Authorization = "Bearer $Token";
    Accept = "application/vnd.github+json";
    "X-GitHub-Api-Version" = "2022-11-28";
    "User-Agent" = "haider-portfolio-deploy"
  }
}

function Ensure-Repo(){
  $createBody = @{ name = $RepoName; private = $false } | ConvertTo-Json
  try{
    Invoke-RestMethod -Method Post -Uri "https://api.github.com/user/repos" -Headers (ApiHeaders) -Body $createBody
  }catch{
    if($_.Exception.Response.StatusCode.Value__ -ne 422){ throw }
  }
}

function Upload-File($LocalPath, $RepoPath){
  $content = To-Base64 $LocalPath
  $uri = "https://api.github.com/repos/$Username/$RepoName/contents/$RepoPath"
  $sha = $null
  try{
    $exists = Invoke-RestMethod -Method Get -Uri $uri -Headers (ApiHeaders)
    if($exists.sha){ $sha = $exists.sha }
  }catch{}
  $message = if($sha){ "Update $RepoPath" } else { "Add $RepoPath" }
  $payload = @{ message = $message; content = $content }
  if($sha){ $payload.sha = $sha }
  $body = $payload | ConvertTo-Json
  Invoke-RestMethod -Method Put -Uri $uri -Headers (ApiHeaders) -Body $body | Out-Null
}

function Enable-Pages(){
  $body = @{ source = @{ branch = "main"; path = "/" } } | ConvertTo-Json
  try{
    Invoke-RestMethod -Method Post -Uri "https://api.github.com/repos/$Username/$RepoName/pages" -Headers (ApiHeaders) -Body $body | Out-Null
  }catch{
    # If already enabled or endpoint variant, attempt PUT
    try{ Invoke-RestMethod -Method Put -Uri "https://api.github.com/repos/$Username/$RepoName/pages" -Headers (ApiHeaders) -Body $body | Out-Null }catch{}
  }
}

function Wait-For-Pages($TimeoutSec=120){
  $start = Get-Date
  while((Get-Date) - $start -lt (New-TimeSpan -Seconds $TimeoutSec)){
    try{
      $resp = Invoke-RestMethod -Method Get -Uri "https://api.github.com/repos/$Username/$RepoName/pages" -Headers (ApiHeaders)
      if($resp.status -eq "built" -or $resp.cname -or $resp.url){ break }
    }catch{}
    Start-Sleep -Seconds 5
  }
}

Write-Host "Creating repository $RepoName for user $Username" -ForegroundColor Cyan
Ensure-Repo

Write-Host "Uploading site files" -ForegroundColor Cyan
$files = Get-ChildItem -Path $Root -File -Recurse | Where-Object { $_.FullName -notmatch "\\\.git\\" }
foreach($file in $files){
  $repoPath = $file.FullName.Substring($Root.Length).TrimStart("\\").Replace("\\","/")
  Upload-File -LocalPath $file.FullName -RepoPath $repoPath
}

Write-Host "Enabling GitHub Pages" -ForegroundColor Cyan
Enable-Pages
Wait-For-Pages

$finalUrl = "https://$($RepoName.ToLower())/"
Write-Host "Deployment complete: $finalUrl" -ForegroundColor Green
