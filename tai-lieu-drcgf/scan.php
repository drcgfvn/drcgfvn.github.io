<?php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
$base = realpath(__DIR__ . '/../tai-lieu');
if (!$base) { http_response_code(404); echo '[]'; exit; }
$slugs = ["video-cong-nghe-spicule-vi-kim-han-quoc", "video-cong-nghe-exosome", "hinh-anh-san-pham-don", "hinh-anh-san-pham-theo-bo", "phac-do-lieu-trinh-combo", "phieu-cong-bo", "phieu-kiem-nghiem", "video-cam-nhan-khach-hang", "video-bac-si-danh-gia-ve-san-pham", "chinh-sach-chiet-khau-va-thuong-npp", "catalogue", "video-su-kien-workshop", "logo-drcgf", "video-to-chuc-tri-an-cho-khach-hang", "video-cac-chuong-trinh-di-du-lich", "slide", "feedback-trai-nghiem-khach-hang", "video-san-pham", "video-feedback-tu-khach-hang"];
$imgExt = ['jpg','jpeg','png','webp','gif','avif'];
$fileExt = ['pdf','ppt','pptx','doc','docx','xls','xlsx','zip'];
$out=[];
foreach ($slugs as $slug) {
  $item=['slug'=>$slug,'images'=>[],'files'=>[]];
  foreach ([['img',$imgExt,'images'],['files',$fileExt,'files']] as $cfg) {
    [$sub,$allowed,$key]=$cfg; $dir=$base.DIRECTORY_SEPARATOR.$slug.DIRECTORY_SEPARATOR.$sub;
    if (!is_dir($dir)) continue;
    $names=scandir($dir); if ($names===false) continue;
    foreach ($names as $name) {
      if ($name==='.' || $name==='..' || $name[0]==='.') continue;
      $ext=strtolower(pathinfo($name, PATHINFO_EXTENSION)); if (!in_array($ext,$allowed,true)) continue;
      $item[$key][]='../tai-lieu/'.rawurlencode($slug).'/'.rawurlencode($sub).'/'.rawurlencode($name);
    }
  }
  $out[]=$item;
}
echo json_encode($out, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
?>