<?php
declare(strict_types=1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: lien-he/index.html', true, 303);
    exit;
}

session_start();
header('X-Content-Type-Options: nosniff');

function text_length(string $value): int {
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}
function clean_text(string $value, int $maxLength): string {
    $value = trim(preg_replace('/\s+/u', ' ', strip_tags($value)) ?? '');
    return function_exists('mb_substr')
        ? mb_substr($value, 0, $maxLength, 'UTF-8')
        : substr($value, 0, $maxLength);
}
function safe_csv_value(string $value): string {
    if ($value !== '' && in_array($value[0], ['=', '+', '-', '@'], true)) return "'" . $value;
    return $value;
}
function fail(string $code = 'invalid'): void {
    header('Location: lien-he/index.html?error=' . rawurlencode($code), true, 303);
    exit;
}

// Honeypot and minimum fill time reduce automated spam.
if (!empty($_POST['website'] ?? '')) fail();
$started = (int)($_POST['form_started'] ?? 0);
if ($started > 0 && (int)(microtime(true) * 1000) - $started < 1800) fail();

$lastSubmit = (int)($_SESSION['drcgf_last_contact_submit'] ?? 0);
if ($lastSubmit && time() - $lastSubmit < 60) fail('rate');

$name = clean_text((string)($_POST['full_name'] ?? ''), 100);
$phone = clean_text((string)($_POST['phone'] ?? ''), 20);
$email = clean_text((string)($_POST['email'] ?? ''), 120);
$business = clean_text((string)($_POST['business'] ?? ''), 150);
$province = clean_text((string)($_POST['province'] ?? ''), 100);
$need = clean_text((string)($_POST['need'] ?? ''), 100);
$message = clean_text((string)($_POST['message'] ?? ''), 1500);
$source = clean_text((string)($_POST['source_page'] ?? ''), 500);

if (text_length($name) < 2 || !preg_match('/^[0-9+ .()\-]{8,20}$/', $phone) || $need === '') fail();
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) fail();

$dataDir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
if (!is_dir($dataDir) && !mkdir($dataDir, 0750, true) && !is_dir($dataDir)) fail();
$file = $dataDir . DIRECTORY_SEPARATOR . 'lien-he.csv';
$isNew = !file_exists($file) || filesize($file) === 0;
$handle = fopen($file, 'ab');
if ($handle === false) fail();
if (!flock($handle, LOCK_EX)) { fclose($handle); fail(); }
if ($isNew) {
    fwrite($handle, "\xEF\xBB\xBF");
    fputcsv($handle, ['Thời gian', 'Họ tên', 'Điện thoại', 'Email', 'Spa/Công ty', 'Tỉnh/TP', 'Nhu cầu', 'Nội dung', 'Trang nguồn', 'IP']);
}
$row = [date('Y-m-d H:i:s'), $name, $phone, $email, $business, $province, $need, $message, $source, (string)($_SERVER['REMOTE_ADDR'] ?? '')];
fputcsv($handle, array_map('safe_csv_value', $row));
flock($handle, LOCK_UN);
fclose($handle);
@chmod($file, 0640);

// Có thể điền email nhận thông báo tại đây. Dữ liệu vẫn luôn được lưu trong data/lien-he.csv.
$notificationEmail = '';
if ($notificationEmail !== '' && filter_var($notificationEmail, FILTER_VALIDATE_EMAIL)) {
    $subject = 'Thông tin liên hệ mới từ website DR.CGF';
    $body = "Họ tên: {$name}\nĐiện thoại: {$phone}\nEmail: {$email}\nSpa/Công ty: {$business}\nTỉnh/TP: {$province}\nNhu cầu: {$need}\nNội dung: {$message}\nNguồn: {$source}";
    $headers = "Content-Type: text/plain; charset=UTF-8\r\n";
    @mail($notificationEmail, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);
}

$_SESSION['drcgf_last_contact_submit'] = time();
header('Location: cam-on/index.html', true, 303);
exit;
?>
