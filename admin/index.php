<?php
// BREK — guest book moderation. Open /admin, enter the key, publish or delete messages.
require __DIR__ . '/../api/store.php';
session_name('brekadmin');
session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict', 'secure' => !empty($_SERVER['HTTPS'])]);
session_start();
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');

if (isset($_POST['key'])) {
  usleep(400000);
  if (password_verify((string)$_POST['key'], ADMIN_HASH)) { session_regenerate_id(true); $_SESSION['ok'] = 1; $_SESSION['csrf'] = bin2hex(random_bytes(16)); }
  else $err = 'Clé incorrecte.';
}
if (isset($_GET['logout'])) { $_SESSION = []; session_destroy(); header('Location: ./'); exit; }
$ok = !empty($_SESSION['ok']);

if ($ok && isset($_POST['act'], $_POST['id']) && hash_equals($_SESSION['csrf'], (string)($_POST['csrf'] ?? ''))) {
  $act = $_POST['act']; $id = (string)$_POST['id'];
  with_store(function (&$db) use ($act, $id) {
    foreach ($db['items'] as $k => $i) if ($i['id'] === $id) {
      if ($act === 'publish') $db['items'][$k]['status'] = 'published';
      elseif ($act === 'hide') $db['items'][$k]['status'] = 'pending';
      elseif ($act === 'delete') unset($db['items'][$k]);
    }
    $db['items'] = array_values($db['items']);
  });
  header('Location: ./'); exit;
}
function e($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
$items = $ok ? read_store()['items'] : [];
usort($items, fn($a, $b) => $b['created'] <=> $a['created']);
$pending = array_filter($items, fn($i) => $i['status'] === 'pending');
$published = array_filter($items, fn($i) => $i['status'] === 'published');
function row($i, $btns) {
  $s = str_repeat('★', $i['rating']) . str_repeat('☆', 5 - $i['rating']);
  $f = '';
  foreach ($btns as $a => $l) $f .= '<form method="post"><input type="hidden" name="csrf" value="' . e($_SESSION['csrf']) . '"><input type="hidden" name="id" value="' . e($i['id']) . '"><button name="act" value="' . $a . '" class="' . $a . '">' . $l . '</button></form>';
  return '<li><div class="m"><b>' . e($i['name']) . '</b> <span>' . $s . '</span> <time>' . date('d.m.Y H:i', $i['created']) . '</time></div><p>' . e($i['text']) . '</p><div class="a">' . $f . '</div></li>';
}
?><!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>BREK · Messages</title>
<style>
:root{--bg:#FAF8F3;--ink:#121212;--muted:#6B665D;--line:#E7E2D8}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:400 16px/1.5 -apple-system,"Helvetica Neue",Arial,sans-serif}
main{max-width:720px;margin:0 auto;padding:32px 16px 64px}h1{font-size:32px;letter-spacing:-.03em;margin:0 0 4px}h2{font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:36px 0 10px}
.top{display:flex;justify-content:space-between;align-items:baseline}.top a{color:var(--muted);font-size:14px}
ul{list-style:none;margin:0;padding:0;border-top:1px solid var(--ink)}li{padding:16px 0;border-bottom:1px solid var(--line)}
.m{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}.m span{letter-spacing:2px}.m time{color:var(--muted);font-size:13px;margin-left:auto}
p{margin:6px 0 10px}.a{display:flex;gap:8px}.a form{margin:0}
button{font-size:14px;font-weight:500;font-family:inherit;padding:9px 16px;border-radius:99px;border:1px solid var(--ink);background:none;cursor:pointer}
button.publish{background:var(--ink);color:#fff}button.delete{border-color:#B3261E;color:#B3261E}
.empty{color:var(--muted);padding:14px 0;border:0}
.login{max-width:340px;margin:20vh auto}.login input{width:100%;font-size:16px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;margin:14px 0}.login button{width:100%;background:var(--ink);color:#fff;padding:12px}.err{color:#B3261E}
</style></head><body><main>
<?php if (!$ok): ?>
  <form class="login" method="post"><h1>BREK.</h1><p style="color:var(--muted)">Messages des visiteurs</p>
  <input type="password" name="key" placeholder="Clé" autocomplete="current-password" autofocus><button>Entrer</button>
  <?php if (!empty($err)) echo '<p class="err">' . e($err) . '</p>'; ?></form>
<?php else: ?>
  <div class="top"><h1>Messages</h1><a href="?logout">Quitter</a></div>
  <h2>À valider (<?= count($pending) ?>)</h2>
  <ul><?php echo $pending ? implode('', array_map(fn($i) => row($i, ['publish' => 'Publier', 'delete' => 'Supprimer']), $pending)) : '<li class="empty">Aucun nouveau message.</li>'; ?></ul>
  <h2>Publiés (<?= count($published) ?>)</h2>
  <ul><?php echo $published ? implode('', array_map(fn($i) => row($i, ['hide' => 'Masquer', 'delete' => 'Supprimer']), $published)) : '<li class="empty">Rien pour l’instant.</li>'; ?></ul>
<?php endif; ?>
</main></body></html>
