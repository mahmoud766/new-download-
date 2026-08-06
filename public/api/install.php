<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$configPath = __DIR__ . '/db_config.json';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($configPath)) {
        $raw = @file_get_contents($configPath);
        $cfg = json_decode($raw, true);
        if ($cfg && !empty($cfg['db_name'])) {
            echo json_encode([
                'installed' => true,
                'db_host' => $cfg['db_host'] ?? 'localhost',
                'db_name' => $cfg['db_name'],
                'db_user' => $cfg['db_user'] ?? '',
                'db_port' => $cfg['db_port'] ?? '3306'
            ]);
            exit();
        }
    }
    echo json_encode(['installed' => false]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        echo json_encode(['success' => false, 'error' => 'بيانات الإدخال غير صالحة']);
        exit();
    }

    $host = !empty($input['db_host']) ? trim($input['db_host']) : 'localhost';
    $port = !empty($input['db_port']) ? trim($input['db_port']) : '3306';
    $dbname = !empty($input['db_name']) ? trim($input['db_name']) : '';
    $user = !empty($input['db_user']) ? trim($input['db_user']) : '';
    $pass = isset($input['db_pass']) ? trim($input['db_pass']) : '';

    if (empty($dbname) || empty($user)) {
        echo json_encode(['success' => false, 'error' => 'يرجى إدخال اسم قاعدة البيانات واسم المستخدم في هوستنجر']);
        exit();
    }

    try {
        // 1. Test MySQL Connection
        $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5
        ]);

        // 2. Create MySQL Tables
        // Table: trending_downloads
        $pdo->exec("CREATE TABLE IF NOT EXISTS trending_downloads (
            id VARCHAR(100) PRIMARY KEY,
            title TEXT,
            platform VARCHAR(50),
            platform_name VARCHAR(50),
            thumbnail TEXT,
            url TEXT,
            duration VARCHAR(20),
            extractions_count INT DEFAULT 1,
            views VARCHAR(30),
            likes VARCHAR(30),
            quality VARCHAR(50),
            badge VARCHAR(50),
            is_real_user TINYINT(1) DEFAULT 1,
            last_extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        // Table: site_settings
        $pdo->exec("CREATE TABLE IF NOT EXISTS site_settings (
            id INT PRIMARY KEY DEFAULT 1,
            settings_json LONGTEXT,
            ads_json LONGTEXT,
            faqs_json LONGTEXT,
            blogs_json LONGTEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        // Table: download_logs
        $pdo->exec("CREATE TABLE IF NOT EXISTS download_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            platform VARCHAR(50),
            title TEXT,
            quality VARCHAR(50),
            ip VARCHAR(50),
            country VARCHAR(100),
            status VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        // Table: visitor_stats
        $pdo->exec("CREATE TABLE IF NOT EXISTS visitor_stats (
            id INT AUTO_INCREMENT PRIMARY KEY,
            date_str VARCHAR(20),
            visitors_count INT DEFAULT 1,
            page_views INT DEFAULT 1,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY (date_str)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        // 3. Save Config File
        $configData = [
            'installed_at' => date('Y-m-d H:i:s'),
            'db_host' => $host,
            'db_port' => $port,
            'db_name' => $dbname,
            'db_user' => $user,
            'db_pass' => $pass
        ];

        file_put_contents($configPath, json_encode($configData, JSON_PRETTY_PRINT));

        echo json_encode([
            'success' => true,
            'message' => 'تم الاتصال بقاعدة بيانات Hostinger بنجاح وتثبيت كافة الجداول تلقائياً!',
            'db_name' => $dbname,
            'db_host' => $host
        ]);

    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'error' => 'فشل الاتصال بقاعدة بيانات Hostinger: ' . $e->getMessage()
        ]);
    }
}
