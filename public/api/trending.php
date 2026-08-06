<?php
require_once __DIR__ . '/db.php';

$pdo = getHostingerPdo();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!$pdo) {
        echo json_encode([]);
        exit();
    }

    try {
        $stmt = $pdo->query("SELECT * FROM trending_downloads ORDER BY is_real_user DESC, extractions_count DESC LIMIT 12");
        $rows = $stmt->fetchAll();
        $results = [];
        foreach ($rows as $r) {
            $results[] = [
                'id' => $r['id'],
                'title' => $r['title'],
                'platform' => $r['platform'],
                'platformName' => $r['platform_name'],
                'thumbnail' => $r['thumbnail'],
                'url' => $r['url'],
                'duration' => $r['duration'],
                'extractionsCount' => (int)$r['extractions_count'],
                'views' => $r['views'],
                'likes' => $r['likes'],
                'quality' => $r['quality'],
                'badge' => $r['badge'],
                'isRealUserExtraction' => (bool)$r['is_real_user'],
                'lastExtractedAt' => $r['last_extracted_at']
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
        echo json_encode(['success' => false, 'error' => 'Database not connected']);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || empty($input['originalUrl'])) {
        echo json_encode(['success' => false, 'error' => 'Invalid video payload']);
        exit();
    }

    try {
        $url = trim($input['originalUrl']);
        $id = 'vid_' . md5($url);
        $title = !empty($input['title']) ? $input['title'] : 'فيديو تم استخراجه من الموقع';
        $platform = strtolower(!empty($input['platform']) ? $input['platform'] : 'video');
        $platformName = !empty($input['platformName']) ? $input['platformName'] : 'Video';
        $thumbnail = !empty($input['thumbnail']) ? $input['thumbnail'] : 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80';
        $duration = !empty($input['duration']) ? $input['duration'] : '0:45';
        $views = !empty($input['viewsCount']) ? $input['viewsCount'] : '2.8M';
        $likes = !empty($input['likesCount']) ? $input['likesCount'] : '450K';
        $quality = !empty($input['quality']) ? $input['quality'] : 'HD No Watermark';
        $badge = '🔥 استخراج حي من زائر';

        // Check if exists
        $stmt = $pdo->prepare("SELECT extractions_count FROM trending_downloads WHERE id = ?");
        $stmt->execute([$id]);
        $existing = $stmt->fetch();

        if ($existing) {
            $updateStmt = $pdo->prepare("UPDATE trending_downloads SET extractions_count = extractions_count + 1, title = ?, thumbnail = ? WHERE id = ?");
            $updateStmt->execute([$title, $thumbnail, $id]);
        } else {
            $insertStmt = $pdo->prepare("INSERT INTO trending_downloads 
                (id, title, platform, platform_name, thumbnail, url, duration, extractions_count, views, likes, quality, badge, is_real_user) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 1)");
            $insertStmt->execute([$id, $title, $platform, $platformName, $thumbnail, $url, $duration, $views, $likes, $quality, $badge]);
        }

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}
