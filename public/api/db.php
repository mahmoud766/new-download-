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

function getHostingerPdo() {
    global $configPath;
    if (!file_exists($configPath)) {
        return null;
    }
    $raw = @file_get_contents($configPath);
    if (!$raw) return null;
    $cfg = json_decode($raw, true);
    if (!$cfg || empty($cfg['db_name'])) return null;

    $host = !empty($cfg['db_host']) ? $cfg['db_host'] : 'localhost';
    $port = !empty($cfg['db_port']) ? $cfg['db_port'] : '3306';
    $dbname = $cfg['db_name'];
    $user = $cfg['db_user'];
    $pass = isset($cfg['db_pass']) ? $cfg['db_pass'] : '';

    try {
        $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 5
        ]);
        return $pdo;
    } catch (Exception $e) {
        return null;
    }
}

function isDbInstalled() {
    return getHostingerPdo() !== null;
}
