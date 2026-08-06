<?php
require_once __DIR__ . '/db.php';

$pdo = getHostingerPdo();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!$pdo) {
        echo json_encode([]);
        exit();
    }

    try {
        $stmt = $pdo->query("SELECT * FROM download_logs ORDER BY id DESC LIMIT 50");
        $rows = $stmt->fetchAll();
        $results = [];
        foreach ($rows as $r) {
            $results[] = [
                'id' => 'log_' . $r['id'],
                'timestamp' => $r['created_at'],
                'platform' => $r['platform'],
                'title' => $r['title'],
                'quality' => $r['quality'],
                'ip' => $r['ip'],
                'country' => $r['country'],
                'status' => $r['status']
            ];
        }
        echo json_encode($results);
    } catch (Exception $e) {
        echo json_encode([]);
    }
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$pdo) {
        echo json_encode(['success' => false]);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        echo json_encode(['success' => false]);
        exit();
    }

    try {
        $platform = $input['platform'] ?? 'Video';
        $title = $input['title'] ?? 'Video Download';
        $quality = $input['quality'] ?? 'HD';
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $country = $input['country'] ?? 'Hostinger Visitor';
        $status = $input['status'] ?? 'SUCCESS';

        $stmt = $pdo->prepare("INSERT INTO download_logs (platform, title, quality, ip, country, status) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$platform, $title, $quality, $ip, $country, $status]);

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}
