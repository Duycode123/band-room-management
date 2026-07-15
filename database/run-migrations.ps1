# Run SQL migrations against the local Docker PostgreSQL container.
# Usage (from repo root):
#   .\database\run-migrations.ps1
#   .\database\run-migrations.ps1 -File database/migrations/20260701_create_app_notifications.sql

param(
    [string]$Container = "bandroomdb",
    [string]$Database = "bandroomdb",
    [string]$User = "postgres",
    [string]$File
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

function Invoke-Migration {
    param([string]$SqlFile)
    $fullPath = if ([System.IO.Path]::IsPathRooted($SqlFile)) { $SqlFile } else { Join-Path $repoRoot $SqlFile }
    if (-not (Test-Path $fullPath)) {
        throw "Migration file not found: $fullPath"
    }

    Write-Host "Running $SqlFile ..."
    Get-Content -Raw $fullPath | docker exec -i $Container psql -v ON_ERROR_STOP=1 -U $User -d $Database
    if ($LASTEXITCODE -ne 0) {
        throw "Migration failed: $SqlFile"
    }
}

if ($File) {
    Invoke-Migration -SqlFile $File
    exit 0
}

$migrations = @(
    "database/migrations/20260624_create_payment_transactions.sql",
    "database/migrations/20260628_rename_vn_schema_to_en.sql",
    "database/migrations/20260630_complete_vn_schema_to_en.sql",
    "database/migrations/20260630_add_review_response_table.sql",
    "database/migrations/20260701_add_customer_issue_report_and_counter_provider.sql",
    "database/migrations/20260701_add_coupon_usage_and_sepay.sql",
    "database/migrations/20260701_create_app_notifications.sql"
)

foreach ($migration in $migrations) {
    Invoke-Migration -SqlFile $migration
}

Write-Host "All migrations completed."
