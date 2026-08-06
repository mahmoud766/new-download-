<?php
require_once __DIR__ . '/db.php';

$pdo = getHostingerPdo();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!$pdo) {
        echo json_encode(['success' => false, 'error' => 'Database not connected']);
        exit();
    }

    try {
        $stmt = $pdo->query("SELECT * FROM site_settings WHERE id = 1");
        $row = $stmt->fetch();
        if ($row) {
            echo json_encode([
                'success' => true,
                'siteSettings' => json_decode($row['settings_json'] ?? '{}', true),
                'adsConfig' => json_decode($row['ads_json'] ?? '[]', true),
                'faqsConfig' => json_decode($row['faqs_json'] ?? '[]', true),
                'blogsConfig' => json_decode($row['blogs_json'] ?? '[]', true),
            ]);
        } else {
            echo json_encode(['success' => true, 'siteSettings' => null]);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$pdo) {
        echo json_encode(['success' => false, 'error' => 'Database not connected']);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
        exit();
    }

    try {
        $stmt = $pdo->query("SELECT id FROM site_settings WHERE id = 1");
        $exists = $stmt->fetch();

        if ($exists) {
            if (isset($input['siteSettings'])) {
                $st = $pdo->prepare("UPDATE site_settings SET settings_json = ? WHERE id = 1");
                $st->execute([json_encode($input['siteSettings'], JSON_UNESCAPED_UNICODE)]);
            }
            if (isset($input['adsConfig'])) {
                $st = $pdo->prepare("UPDATE site_settings SET ads_json = ? WHERE id = 1");
                $st->execute([json_encode($input['adsConfig'], JSON_UNESCAPED_UNICODE)]);
            }
            if (isset($input['faqsConfig'])) {
                $st = $pdo->prepare("UPDATE site_settings SET faqs_json = ? WHERE id = 1");
                $st->execute([json_encode($input['faqsConfig'], JSON_UNESCAPED_UNICODE)]);
            }
            if (isset($input['blogsConfig'])) {
                $st = $pdo->prepare("UPDATE site_settings SET blogs_json = ? WHERE id = 1");
                $st->execute([json_encode($input['blogsConfig'], JSON_UNESCAPED_UNICODE)]);
            }
        } else {
            $s = json_encode($input['siteSettings'] ?? [], JSON_UNESCAPED_UNICODE);
            $a = json_encode($input['adsConfig'] ?? [], JSON_UNESCAPED_UNICODE);
            $f = json_encode($input['faqsConfig'] ?? [], JSON_UNESCAPED_UNICODE);
            $b = json_encode($input['blogsConfig'] ?? [], JSON_UNESCAPED_UNICODE);

            $st = $pdo->prepare("INSERT INTO site_settings (id, settings_json, ads_json, faqs_json, blogs_json) VALUES (1, ?, ?, ?, ?)");
            $st->execute([$s, $a, $f, $b]);
        }

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}
