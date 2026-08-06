<?php
require_once __DIR__ . '/db.php';

$pdo = getHostingerPdo();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!$pdo) {
        echo json_encode([]);
        exit();
    }

    try {
        $stmt = $pdo->query("SELECT * FROM visitor_stats ORDER BY id DESC LIMIT 14");
        $rows = $stmt->fetchAll();
        $results = [];
        foreach ($rows as $r) {
            $results[] = [
                'date' => $r['date_str'],
                'visitors' => (int)$r['visitors_count'],
                'pageViews' => (int)$r['page_views']
            ];
        }
        echo json_encode(array_reverse($results));
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

    try {
        $today = date('Y-m-d');
        $stmt = $pdo->prepare("SELECT id FROM visitor_stats WHERE date_str = ?");
        $stmt->execute([$today]);
        $exists = $stmt->fetch();

        if ($exists) {
            $u = $pdo->prepare("UPDATE visitor_stats SET visitors_count = visitors_count + 1, page_views = page_views + 1 WHERE date_str = ?");
            $u->execute([$today]);
        } else {
            $i = $pdo->prepare("INSERT INTO visitor_stats (date_str, visitors_count, page_views) VALUES (?, 1, 1)");
            $i->execute([$today]);
        }

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false]);
    }
    exit();
}
