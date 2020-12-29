<?php

class cPhotoDb extends cPhotoAbstractEngine
{
    public function getById(int $photoId, string $size="S"): string
    {
        $path = "";

        $photoPaths = cPostgreDb::execute("SELECT path FROM photo WHERE ID = {$photoId}");
        foreach ($photoPaths as &$photoPath) {
            $d = dirname($photoPath);
            $f = basename($photoPath);
            $tdir="$d/@eaDir/$f";
            foreach (["$tdir/SYNOPHOTO:THUMB_{$size}.jpg", "$tdir/SYNOPHOTO_THUMB_{$size}.jpg"] as $thumbailPath) {
                if (file_exists($thumbailPath)) {
                    $path = $thumbailPath;
                    break;
                } else {
                    throw new \InvalidArgumentException("Invalid photo id `{$photoId}``");
                }
            }
        }

        return $path;
    }

    /**
     * @param int $count
     * @param string $size
     * @return cPhoto[]
     */
    public function getRandomPhoto(int $count = 10, string $size="S"): array
    {
        $photoPaths = cPostgreDb::execute("SELECT path FROM photo WHERE resolutionx > 0 ORDER BY RANDOM() LIMIT {$count}");
        foreach ($photoPaths as &$photoPath) {
            $d = dirname($photoPath);
            $f = basename($photoPath);
            $tdir="$d/@eaDir/$f";
            foreach (["$tdir/SYNOPHOTO:THUMB_{$size}.jpg", "$tdir/SYNOPHOTO_THUMB_{$size}.jpg"] as $thumbailPath) {
				if (file_exists($thumbailPath)) {
					$photo = new cPhoto($thumbailPath, $this->path);
                    $photo->setContent(file_get_contents($photo->getFullPath()));
                    break;
                }
			}
        }

        return $photoPaths;
    }
}
