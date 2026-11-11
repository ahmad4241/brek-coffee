<?php
// Shared storage for the guest book. Comments live in ../data (never served: see data/.htaccess).
const ADMIN_HASH = '$2y$10$WyHzhsuyyXK/fXmlmi.9juyypa8mFlvxMg6cH4kOnnQL.NhccAaPG';

function data_dir() {
  $d = __DIR__ . '/../data';
  if (!is_dir($d)) @mkdir($d, 0750, true);
  return $d;
}
// the file is a .php that exits at once, so even without .htaccess nobody can download it
const GUARD = "<?php http_response_code(404); exit; ?>\n";
function store_file() { return data_dir() . '/avis.data.php'; }
function decode_store($raw) {
  if (strpos($raw, GUARD) === 0) $raw = substr($raw, strlen(GUARD));
  $db = json_decode($raw ?: '{}', true);
  return is_array($db) ? $db : [];
}
// read-modify-write under one lock so two visitors never overwrite each other
function with_store(callable $fn) {
  $fh = fopen(store_file(), 'c+');
  if (!$fh) return null;
  flock($fh, LOCK_EX);
  $db = decode_store(stream_get_contents($fh)) + ['items' => [], 'rate' => []];
  $out = $fn($db);
  ftruncate($fh, 0); rewind($fh);
  fwrite($fh, GUARD . json_encode($db, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
  fflush($fh); flock($fh, LOCK_UN); fclose($fh);
  return $out;
}
function read_store() {
  if (!is_file(store_file())) return ['items' => []];
  return decode_store(file_get_contents(store_file())) + ['items' => []];
}
