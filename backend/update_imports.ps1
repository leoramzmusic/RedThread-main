$files = Get-ChildItem -Path "backend\src" -Recurse -Include *.py

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Replace imports
    $content = $content -replace 'from src\.db\.schemas\.', 'from src.models.'
    $content = $content -replace 'from src\.routers\.', 'from src.api.'
    $content = $content -replace 'from src\.config import', 'from src.core.config import'
    $content = $content -replace 'from src\.utils\.', 'from src.core.utils.'
    $content = $content -replace 'from src\.middleware\.', 'from src.core.middleware.'
    
    Set-Content $file.FullName -Value $content
}

Write-Host "Import updates complete!"
