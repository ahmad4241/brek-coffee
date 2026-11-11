<?php
// GET  -> published comments (newest first)
// POST -> a new comment, shown at once; the shop can hide or delete it in /admin
require __DIR__ . '/store.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function out($code, $data) { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
function clean($s, $max) {
  $s = trim(preg_replace('/\s+/u', ' ', (string)$s));
  $s = preg_replace('/[\x{0000}-\x{001F}\x{007F}]/u', '', $s);
  return mb_substr($s, 0, $max);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $db = read_store();
  $list = array_values(array_filter($db['items'], fn($i) => ($i['status'] ?? '') === 'published'));
  // pinned messages first (in the order they were pinned), then the newest
  usort($list, function ($a, $b) {
    $pa = $a['pinned'] ?? 0; $pb = $b['pinned'] ?? 0;
    if ($pa && $pb) return $pa <=> $pb;
    if ($pa || $pb) return $pa ? -1 : 1;
    return $b['created'] <=> $a['created'];
  });
  $list = array_map(fn($i) => ['name' => $i['name'], 'rating' => $i['rating'], 'text' => $i['text'], 'date' => date('Y-m-d', $i['created']), 'pinned' => !empty($i['pinned'])], array_slice($list, 0, 60));
  out(200, ['items' => $list]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, ['error' => 'method']);

$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) $in = $_POST;

// bots: the hidden field must stay empty and the form must have been open for a few seconds
if (!empty($in['website'])) out(200, ['ok' => true]);
$opened = (int)($in['t'] ?? 0);
if ($opened && (time() * 1000 - $opened) < 3000) out(429, ['error' => 'Un instant, puis réessayez.']);

$name = clean($in['name'] ?? '', 40);
$text = clean($in['text'] ?? '', 500);
$rating = (int)($in['rating'] ?? 0);
if (mb_strlen($name) < 2) out(422, ['error' => 'Ajoutez votre prénom.']);
if (mb_strlen($text) < 5) out(422, ['error' => 'Votre message est un peu court.']);
if ($rating < 1 || $rating > 5) out(422, ['error' => 'Choisissez une note.']);
if (preg_match('~(https?://|www\.|\.(com|net|ru|xyz|ch|fr)\b|<|>)~iu', $name . ' ' . $text)) out(422, ['error' => 'Les liens ne sont pas acceptés.']);

$ip = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . 'brek');
$res = with_store(function (&$db) use ($ip, $name, $text, $rating) {
  $now = time();
  $hits = array_values(array_filter($db['rate'][$ip] ?? [], fn($t) => $t > $now - 86400));
  if ($hits && end($hits) > $now - 60) return 'wait';
  if (count($hits) >= 5) return 'day';
  $today = count(array_filter($db['items'], fn($i) => $i['created'] > $now - 86400));
  if ($today >= 100) return 'full';
  $hits[] = $now; $db['rate'][$ip] = $hits;
  foreach ($db['rate'] as $k => $v) if (max($v) < $now - 86400) unset($db['rate'][$k]);
  $db['items'][] = ['id' => bin2hex(random_bytes(6)), 'name' => $name, 'rating' => $rating, 'text' => $text, 'created' => $now, 'status' => 'published'];
  return 'ok';
});
if ($res === 'wait') out(429, ['error' => 'Merci ! Attendez une minute avant un nouveau message.']);
if ($res === 'day' || $res === 'full') out(429, ['error' => 'Trop de messages pour aujourd’hui. Revenez demain.']);
if ($res !== 'ok') out(500, ['error' => 'Oups, réessayez plus tard.']);
out(200, ['ok' => true]);
