<?php
require_once __DIR__ . '/../vendor/autoload.php';

$photosPerPage = getParam('per_page', 1);
$photoSize = getParam('size', 'B');
$photoId = getParam('photo_id');

$config = parse_ini_file(__DIR__ . '/../app/config.ini');
$photoEngine = cPhotoFactory::create($config['engine'] ?: 'Filesystem' , $config['parameters']);
//print_r($config);die();

$photos = isset($photoId) && $photoId >= 0
    ? [$photoEngine->transform($photoId, $photoSize)]
    : $photoEngine->getRandomPhoto($photosPerPage, $photoSize);

if (getParam("image") == 1) {
    $contentType = "image/jpeg";
    $content = $photos[0]->getContent();
} else {
    $returnPhotos = [];
    $im = new \Imagick();
    foreach ($photos as $photo) {
        $im->readImageBlob($photo->getContent());
        $photoInfo = [
            "src" => "data:image/jpeg;base64, " . base64_encode($photo->getContent()),
            "name" => $photo->getName(),
            "path" => $photo->getPath(),
            "width" => $im->getImageWidth(),
            "height" => $im->getImageHeight(),
            "id" => $photo->getId()
        ];

        if ($photo->getDate()) {
            $photoInfo["date"] = $photo->getDate()->format("Y-m-d");
        }

        $returnPhotos[] = $photoInfo;
    }

    $contentType = "application/json";
    $content = json_encode($returnPhotos);
}

header("Content-Type: {$contentType}");
echo $content;


function getParam(string $paramName, $paramDefaultValue = null) {
    $params = php_sapi_name() == "cli" ? [] : $_GET;
    return isset($params[$paramName]) ? $params[$paramName] : $paramDefaultValue;
}
