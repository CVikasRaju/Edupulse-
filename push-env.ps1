$vars = @{
  "NEXT_PUBLIC_SUPABASE_URL"     = "https://ykxnxnrcwmlzgsopqlue.supabase.co"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"= "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreG54bnJjd21semdzb3BxbHVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNjE0MDQsImV4cCI6MjA5MzYzNzQwNH0.OWHZ--IxW77ZjoRpWA8y_RYi2SG0Of03gdUMC1JNcOE"
  "SUPABASE_SERVICE_ROLE_KEY"    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreG54bnJjd21semdzb3BxbHVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODA2MTQwNCwiZXhwIjoyMDkzNjM3NDA0fQ.7Ewey1Qx_MuT2MRNeLNwHPLAwRblnv_EKMcOEbxt1_Y"
  "DATABASE_URL"                 = "postgresql://postgres.ykxnxnrcwmlzgsopqlue:Rajuedupulse%4015@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  "DIRECT_URL"                   = "postgresql://postgres.ykxnxnrcwmlzgsopqlue:Rajuedupulse%4015@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
  "GEMINI_API_KEY"               = "AIzaSyBhzn7iJg5EvWgZm-NRYqiuLuAwEQzOafg"
}

foreach ($key in $vars.Keys) {
  $value = $vars[$key]
  Write-Host "Adding $key ..."
  # Write value to temp file to avoid shell escaping issues
  $tmpFile = [System.IO.Path]::GetTempFileName()
  Set-Content -Path $tmpFile -Value $value -NoNewline -Encoding utf8
  # Add for all three environments
  foreach ($env in @("production", "preview", "development")) {
    $result = $value | npx vercel env add $key $env 2>&1
    Write-Host "  [$env] $result"
  }
  Remove-Item $tmpFile -Force
}

Write-Host "`nDone! All env vars pushed to Vercel."
