# Test de connectivité réseau SGDO
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Test de Connectivité Réseau SGDO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ServerIP = "10.20.14.130"
$BackendPort = 5000
$FrontendPort = 8080

Write-Host "Configuration testée:" -ForegroundColor Yellow
Write-Host "- IP Serveur: $ServerIP"
Write-Host "- Port Backend: $BackendPort"
Write-Host "- Port Frontend: $FrontendPort"
Write-Host ""

# Test 1: Vérification de la configuration .env
Write-Host "Test 1: Vérification de la configuration .env..." -ForegroundColor Green
if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    
    $apiUrlFound = $envContent | Select-String "VITE_API_BASE_URL=http://10.20.14.130:5000"
    $frontendUrlFound = $envContent | Select-String "FRONTEND_BASE_URL=http://10.20.14.130:8080"
    
    if ($apiUrlFound) {
        Write-Host "[OK] Configuration API correcte" -ForegroundColor Green
    } else {
        Write-Host "[ERREUR] Configuration API incorrecte dans .env" -ForegroundColor Red
        Write-Host "Attendu: VITE_API_BASE_URL=http://10.20.14.130:5000" -ForegroundColor Yellow
    }
    
    if ($frontendUrlFound) {
        Write-Host "[OK] Configuration Frontend correcte" -ForegroundColor Green
    } else {
        Write-Host "[ERREUR] Configuration Frontend incorrecte dans .env" -ForegroundColor Red
        Write-Host "Attendu: FRONTEND_BASE_URL=http://10.20.14.130:8080" -ForegroundColor Yellow
    }
} else {
    Write-Host "[ERREUR] Fichier .env non trouvé" -ForegroundColor Red
}

Write-Host ""

# Test 2: Test de ping
Write-Host "Test 2: Ping du serveur..." -ForegroundColor Green
try {
    $pingResult = Test-Connection -ComputerName $ServerIP -Count 2 -Quiet
    if ($pingResult) {
        Write-Host "[OK] Serveur $ServerIP accessible" -ForegroundColor Green
    } else {
        Write-Host "[ERREUR] Serveur $ServerIP non accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERREUR] Impossible de ping $ServerIP" -ForegroundColor Red
}

Write-Host ""

# Test 3: Test des ports
Write-Host "Test 3: Test des ports..." -ForegroundColor Green

# Test port backend
try {
    $backendTest = Test-NetConnection -ComputerName $ServerIP -Port $BackendPort -WarningAction SilentlyContinue
    if ($backendTest.TcpTestSucceeded) {
        Write-Host "[OK] Port $BackendPort accessible" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Port $BackendPort non accessible - serveur backend probablement arrêté" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[INFO] Test port $BackendPort échoué" -ForegroundColor Yellow
}

# Test port frontend
try {
    $frontendTest = Test-NetConnection -ComputerName $ServerIP -Port $FrontendPort -WarningAction SilentlyContinue
    if ($frontendTest.TcpTestSucceeded) {
        Write-Host "[OK] Port $FrontendPort accessible" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Port $FrontendPort non accessible - serveur frontend probablement arrêté" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[INFO] Test port $FrontendPort échoué" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Configuration pare-feu
Write-Host "Test 4: Vérification du pare-feu Windows..." -ForegroundColor Green

try {
    $backendRule = Get-NetFirewallRule -DisplayName "SGDO Backend" -ErrorAction SilentlyContinue
    if ($backendRule) {
        Write-Host "[OK] Règle pare-feu Backend existe" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Règle pare-feu Backend non trouvée" -ForegroundColor Yellow
        Write-Host "Commande pour créer la règle:" -ForegroundColor Cyan
        Write-Host "New-NetFirewallRule -DisplayName 'SGDO Backend' -Direction Inbound -Protocol TCP -LocalPort $BackendPort -Action Allow" -ForegroundColor Gray
    }
} catch {
    Write-Host "[INFO] Impossible de vérifier les règles pare-feu" -ForegroundColor Yellow
}

try {
    $frontendRule = Get-NetFirewallRule -DisplayName "SGDO Frontend" -ErrorAction SilentlyContinue
    if ($frontendRule) {
        Write-Host "[OK] Règle pare-feu Frontend existe" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Règle pare-feu Frontend non trouvée" -ForegroundColor Yellow
        Write-Host "Commande pour créer la règle:" -ForegroundColor Cyan
        Write-Host "New-NetFirewallRule -DisplayName 'SGDO Frontend' -Direction Inbound -Protocol TCP -LocalPort $FrontendPort -Action Allow" -ForegroundColor Gray
    }
} catch {
    Write-Host "[INFO] Impossible de vérifier les règles pare-feu" -ForegroundColor Yellow
}

Write-Host ""

# Test 5: Test HTTP (si serveurs démarrés)
Write-Host "Test 5: Test HTTP..." -ForegroundColor Green

try {
    $backendResponse = Invoke-WebRequest -Uri "http://$ServerIP`:$BackendPort/" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($backendResponse.StatusCode -eq 200) {
        Write-Host "[OK] Backend API répond (Status: $($backendResponse.StatusCode))" -ForegroundColor Green
    }
} catch {
    Write-Host "[INFO] Backend API non accessible - serveur probablement arrêté" -ForegroundColor Yellow
}

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://$ServerIP`:$FrontendPort/" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "[OK] Frontend répond (Status: $($frontendResponse.StatusCode))" -ForegroundColor Green
    }
} catch {
    Write-Host "[INFO] Frontend non accessible - serveur probablement arrêté" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Résumé du Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs à tester dans un navigateur:" -ForegroundColor Yellow
Write-Host "- Frontend: http://$ServerIP`:$FrontendPort" -ForegroundColor White
Write-Host "- API Backend: http://$ServerIP`:$BackendPort" -ForegroundColor White
Write-Host ""
Write-Host "Pour démarrer les serveurs:" -ForegroundColor Yellow
Write-Host "1. Exécuter: start-network-mode.bat" -ForegroundColor White
Write-Host "2. Ou démarrer manuellement backend et frontend" -ForegroundColor White
Write-Host ""
Write-Host "Si problèmes persistent:" -ForegroundColor Yellow
Write-Host "1. Vérifier que les serveurs sont démarrés" -ForegroundColor White
Write-Host "2. Configurer le pare-feu Windows" -ForegroundColor White
Write-Host "3. Tester depuis un autre poste du réseau" -ForegroundColor White
Write-Host ""
