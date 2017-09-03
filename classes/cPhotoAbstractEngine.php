<?php

abstract class cPhotoAbstractEngine
{
    /** @var string */
    protected $path;

    public function __construct(array $options)
    {
        $this->path = $options['path'];
    }

    /**
     * @param int $count
     * @param string $size
     * @return cPhoto[]
     */
    abstract public function getRandomPhoto(int $count = 10, string $size="S"): array;

    abstract public function getById(int $photoId): string;

    public function transform(int $photoId, string $size): cPhoto
    {
        $photoPath = $this->getById($photoId);
        $photo = new cPhoto($photoPath, $this->path);
        $photo->setId($photoId);

        $width = null;
        $height = null;

        switch ($size) {
            case 'original':
                break;

            case 'B':
                $width = 400;
                $height = 400;
                break;
        }

        $content = \CameraRaw::extractPreview($photoPath, null,$width, $height);
        if ($width && $height) {
            $content = \CameraRaw::generateImage($content, $width, $height);
        }
        $photo->setContent($content);

        return $photo;
    }

}
